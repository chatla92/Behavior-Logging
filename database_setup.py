from sqlalchemy import Column, ForeignKey, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, backref
from sqlalchemy import create_engine
from passlib.apps import postgres_context
import datetime

Base = declarative_base()

# sudo -u postgres psql -c "CREATE ROLE behavior WITH LOGIN PASSWORD 'behavior';"
# sudo -u postgres psql -c "ALTER USER behavior PASSWORD 'behavior';"

class Users(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(250), nullable=False)
    password_hash = Column(String(64))

    def hash_password(self, password):
        self.password_hash = postgres_context.hash(password,user="behavior")

    def verify_password(self, password):
        return postgres_context.verify(password, self.password_hash,user="behavior")


class History(Base):
    __tablename__ = 'history'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    users = relationship(Users, backref=backref("history", cascade="all, delete-orphan"))
    time = Column(String(30))
    url = Column(String(1000), nullable=False)
    action = Column(String(100), nullable=False)
    event = Column(String(1000), nullable=False)
    link = Column(String(1000))
    
    @property
    def serialize(self):
        """Return object data in easily serializeable format"""
        return {
            'user_id': self.user_id,
            'time': self.time,
            'url': self.url,
            'action': self.action,
	    'event': self.event,
	    'link' : self.link
        }

engine = create_engine('postgresql://behavior:behavior@localhost:5432/postgres')


Base.metadata.create_all(engine)
