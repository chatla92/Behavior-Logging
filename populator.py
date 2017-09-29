from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from database_setup import Users
Base = declarative_base()
engine = create_engine('postgresql://behavior:behavior@localhost:5432/postgres')
Base.metadata.bind = engine

DBSession = sessionmaker(bind=engine)
session = DBSession()

for ind in ["aaa", "bbb", "ccc"]:
    U = Users(name=ind)
    U.hash_password("123")
    session.add(U)
    session.commit()
