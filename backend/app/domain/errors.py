class DomainError(Exception):
    """Error base del dominio. No conoce HTTP: solo define un código estable."""

    code = "domain_error"
    default_message = "Ocurrió un error"

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.default_message)


class DatabaseUnavailableError(DomainError):
    code = "database_unavailable"
    default_message = "No se pudo conectar a la base de datos"


class InvalidFileError(DomainError):
    code = "invalid_file"
    default_message = (
        "El formato no es soportado o el archivo no es válido (se aceptan PDF y Excel .xls)"
    )


class EmptyFileError(DomainError):
    code = "empty_file"
    default_message = "El archivo está vacío"


class NoSubjectsFoundError(DomainError):
    code = "no_subjects_found"
    default_message = "No se encontraron materias en el documento"


class FileTooLargeError(DomainError):
    code = "file_too_large"
    default_message = "El archivo supera el tamaño máximo permitido"


class DomainInvariantError(DomainError):
    """Una invariante del dominio fue violada (indica un defecto, no un error del usuario)."""

    code = "domain_invariant"
    default_message = "Los datos extraídos son inconsistentes"
