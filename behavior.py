from flask import Flask, render_template, request, redirect, jsonify
from flask import make_response, flash
from sqlalchemy import create_engine, asc, desc, func, and_
from sqlalchemy.orm import sessionmaker
from database_setup import History, Users
from flask import session as login_session
from sqlalchemy.ext.declarative import declarative_base
from flask.ext.httpauth import HTTPBasicAuth
from flask_sslify import SSLify
import datetime, sys, re
import dateutil.parser as dp


app = Flask(__name__)
sslify = SSLify(app, permanent=True)
auth = HTTPBasicAuth()
app.debug = True
app.secret_key = 'super_secret_key'
APPLICATION_NAME = 'Behavior Logging'

# Connect to Database and create database session
Base = declarative_base()
engine = create_engine('postgresql://behavior:behavior@localhost:5432/postgres')
Base.metadata.bind = engine

DBSession = sessionmaker(bind=engine)
session = DBSession()

@app.route('/')
@app.route('/login', methods=['GET', 'POST'])
def show_login():
    """
    Login page 
    :return: Redirects the user to the home page after validating credentials
    """

    if request.method == 'POST':
        username = request.form['name']
        password = request.form['password']
        if username is None or password is None:
            flash('Username or password cannot be empty')
            return redirect('/login')
        try:
            user = session.query(Users).filter_by(name=username).one()
	    
        except Exception as e:
	    print(e)
            flash('User does not exist')
            return redirect('/login')

        if verify_password(username, password):
            login_session['username'] = username
            login_session['user_id'] = user.id
            hist = History(user_id=user.id, event='login', action='click',url='https://0.0.0.0:8000/login',
                           time="{:%H:%M.%S %B %d, %Y}".format(datetime.datetime.utcnow()))
            session.add(hist)
            session.commit()
            flash('Logged in succesfully')
            return redirect('/home')
        flash('Entered Credentials are wrong')
        return redirect('/login')
    return render_template('login.html')


@auth.verify_password
def verify_password(username, password):
    """
    Verifies the the password of the user
    :param username: User name
    :param password: password
    :return: True, if credentials matched otherwise false
    """
    user = session.query(Users).filter_by(name=username).first()
    if not user or not user.verify_password(password):
        return False
    return True


@app.route('/users/add', methods=['GET', 'POST'])
def new_user():
    """
    Add a new user 
    :return: Redirects to login page if username already exists or to home page if user is created succesfully
    """
    if request.method == 'GET':
        return render_template('user_add.html')
    if request.method == 'POST':
        username = request.form['name']
        password = request.form['password']
        if username is None or password is None:
            flash('Username or password cannot be empty')
            return redirect('/login')

        if session.query(Users).filter_by(name=username).first() is not None:
            flash('user already exists')
            return redirect('/login')
        max_id = int(session.query(func.max(Users.id)).one()[0]) + 1
        user = Users(id=max_id, name=username)
        user.hash_password(password)
        session.add(user)
        session.commit()
        user = session.query(Users).filter_by(name=username).first()
        login_session['username'] = username
        login_session['user_id'] = user.id
        flash('User created succesfully')
        return redirect('/home')


@app.route('/home', methods=['GET', 'POST'])
def home():
    if 'user_id' not in login_session:
        return redirect('/login')
    history = session.query(History).filter(and_(History.user_id == login_session['user_id'], History.event == 'login'))
    collection = session.query(History).filter(and_(History.user_id == login_session['user_id'], History.event != 'login'))
    return render_template('home.html', user=login_session['username'], history=history, collection=collection)


@app.route('/disconnect')
def disconnect():
    """
    Log off the user and unset login_session keys 
    :return: 
    """
    del login_session['username']
    del login_session['user_id']
    flash("You have successfully been logged out.")
    return redirect('/login')


@app.route('/log', methods=['POST'])
def log():
    event = request.data.split(",")
    hist = History(user_id=login_session['user_id'], url=event[1], action=event[2], event=event[3],
                   time="{:%H:%M.%S %B %d, %Y}".format(datetime.datetime.utcnow()))
    session.add(hist)
    session.commit()
    print event
    return 'OK'

@app.route('/jsonlog', methods=['GET'])
def jsonlog():
    history = session.query(History).all()
    return jsonify(Log=[hist.serialize for hist in history])  

@app.route('/visulaize')
def visualize():
    time = session.query(History).filter(and_(History.user_id == login_session['user_id'], History.action == 'time_spent'))
    click = session.query(History).filter(and_(History.user_id == login_session['user_id'], History.action == 'click'))
    history = session.query(History).filter_by(user_id=login_session['user_id'])
    all_links = session.query(History).filter_by(action = 'time_spent')

    tag = re.compile('^https?:\/\/(?:[^./?#]+\.)?stackoverflow\.com\/questions\/tagged\/([A-z]+)')
    tag2 = re.compile('^https?:\/\/(?:[^./?#]+\.)?stackoverflow\.com\/search\?q=(.*)')
    query_time = {}
    all_data = {}

    tags = {}
    success = {'val':0.0,'pass':[],'fail':[]}
    heat = {}
    years = set()
    tags_list = []
    all_list = []
    user_daily_tags = {} 
    for h in history:
        dt = dp.parse(h.time)
        years.add(dt.year)
        date = dt.strftime("%Y-%m-%d")

        try:
            heat[date]= heat[date]+1
        except:
            heat[date] = 1

    for t in time:
        try:
            if (tag.match(t.url)):
                query_time[str(t.url)][1] = float(query_time[str(t.url)][1])+float(str(t.event))
        except:
            if (tag.match(t.url)):
                query_time[str(t.url)] = [str(tag.match(t.url).group(1)), str(t.event)]

	if(dp.parse(t.time).strftime("%Y-%m-%d")) in user_daily_tags:
		try:
			if (tag.match(t.url)):
				user_daily_tags[dp.parse(t.time).strftime("%Y-%m-%d")][str(tag.match(t.url).group(1))] = float(user_daily_tags[dp.parse(t.time).strftime("%Y-%m-%d")][str(tag.match(t.url).group(1))]) + float(str(t.event))
		except:
			if (tag.match(t.url)):
				user_daily_tags[dp.parse(t.time).strftime("%Y-%m-%d")][str(tag.match(t.url).group(1))]=float(str(t.event))
    	else:
		if (tag.match(t.url)):
			user_daily_tags[dp.parse(t.time).strftime("%Y-%m-%d")]={}
			user_daily_tags[dp.parse(t.time).strftime("%Y-%m-%d")][str(tag.match(t.url).group(1))]=float(str(t.event))
    
    today = datetime.datetime.today()
    margin = datetime.timedelta(days = 7)

    for link in all_links:
	if (today - margin <= dp.parse(link.time) <= today + margin):

		if (tag.match(link.url)):
			try:
				all_data[tag.match(link.url).group(1)] = all_data[tag.match(link.url).group(1)]+1
			except:
				all_data[tag.match(link.url).group(1)] =1

		elif(tag2.match(link.url)):
			for ele in [item for item in str(tag2.match(link.url).group(1)).split("+") if item not in ['what','is','the','the']]:
				try:
					all_data[ele] = all_data[ele]+1
				except:
					all_data[ele] = 1

    for c in click:
        try:
            query_time[str(c.url)].append(str(c.event))
        except:
            pass

    for q in query_time.keys():
        d = query_time[q]
        try:
            tags[d[0]] = float(tags[d[0]]) + float(d[1])
        except:
            tags[d[0]] = d[1]
        if len(d)>2:
            success['val'] = success['val']+1
	    success['pass'].append(d[0])
	else:
	    success['fail'].append(d[0])
    
    for tag in tags.keys():
	tags_list.append({"label":tag, "value": tags[tag]})

    for d in all_data.keys():
	all_list.append({"label":d, "value":all_data[d]})

    if (len(query_time)):
    	success['val'] = success['val']/len(query_time)

    domain = [heat[min(heat, key=heat.get)],heat[max(heat, key=heat.get)]]
    years = list(years)
    return jsonify({'domain': domain, 'years': years, 'heat':heat, 'tags':tags_list, 'success':success, 'social':all_list, 'daily':user_daily_tags})

def get_user_info(user_id):
    """
    Retrive user details from the database
    :param user_id: 
    :return: 
    """
    user = session.query(Users).filter_by(id=user_id).one()
    return user


if __name__ == '__main__':
    app.secret_key = 'super_secret_key'
    app.debug = True
    app.run(ssl_context=('/etc/ssl/certs/apache-selfsigned.crt', '/etc/ssl/private/apache-selfsigned.key'),host='0.0.0.0', port=8000)
