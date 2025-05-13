from dataclasses import dataclass

from environs import Env


@dataclass
class Site:
    postgres: str
    redis: str


@dataclass
class JwtAuth:
    secret_key: str
    algorithm: str

@dataclass
class Mail:
    mail_user: str
    mail_password: str
    to_email: str

@dataclass
class Config:
    site: Site
    jwt_auth: JwtAuth
    mail: Mail


def load_config():
    env = Env()
    env.read_env()
    return Config(
        site=Site(env('DB_POSTGRES'),
                  env('DB_REDIS')),
        jwt_auth=JwtAuth(
            secret_key=env('SECRET_KEY_JWT'),
            algorithm=env("ALGORYTHM_JWT")
        ),
        mail=Mail(
            mail_user=env('MAIL_USER'),
            mail_password=env('MAIL_PASSWORD'),
            to_email=env('TO_EMAIL')
        )
    )
