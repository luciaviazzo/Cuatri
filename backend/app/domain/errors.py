class DomainError(Exception):
    """Error base del dominio."""

    code = "domain_error"
    status_code = 400


class DatabaseUnavailableError(DomainError):
    code = "database_unavailable"
    status_code = 503
