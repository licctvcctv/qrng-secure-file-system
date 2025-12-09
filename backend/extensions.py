from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_session import Session

db = SQLAlchemy()
cors = CORS()
login_manager = LoginManager()
migrate = Migrate()
sess = Session()
