#!/bin/bash

# if nobody manually set a host to listen on then go with all available interfaces and host names
if [ -z "$MB_JETTY_HOST" ]; then
    export MB_JETTY_HOST=0.0.0.0
fi

# Setup Java Options
JAVA_OPTS="${JAVA_OPTS} -XX:+IgnoreUnrecognizedVMOptions"
JAVA_OPTS="${JAVA_OPTS} -Dfile.encoding=UTF-8"
JAVA_OPTS="${JAVA_OPTS} -Dlogfile.path=target/log"
JAVA_OPTS="${JAVA_OPTS} -XX:+CrashOnOutOfMemoryError"
JAVA_OPTS="${JAVA_OPTS} -server"

if [ ! -z "$JAVA_TIMEZONE" ]; then
    JAVA_OPTS="${JAVA_OPTS} -Duser.timezone=${JAVA_TIMEZONE}"
fi

# Check if the Metabase JAR file exists
if [ ! -f /app/metabase.jar ]; then
    echo "Error: /app/metabase.jar not found. Exiting."
    exit 1
fi

# usage: file_env VAR [DEFAULT]
file_env() {
    local var="$1"
    local fileVar="${var}_FILE"
    local def="${2:-}"
    if [ "${!var:-}" ] && [ "${!fileVar:-}" ]; then
        echo >&2 "error: both $var and $fileVar are set (but are exclusive)"
        exit 1
    fi
    local val="$def"
    if [ "${!var:-}" ]; then
        val="${!var}"
    elif [ "${!fileVar:-}" ]; then
        val="$(< "${!fileVar}")"
    fi
    export "$var"="$val"
    unset "$fileVar"
}

# Process secret environment variables
docker_setup_env() {
    file_env 'MB_DB_USER'
    file_env 'MB_DB_PASS'
    file_env 'MB_DB_CONNECTION_URI'
    file_env 'MB_EMAIL_SMTP_PASSWORD'
    file_env 'MB_EMAIL_SMTP_USERNAME'
    file_env 'MB_LDAP_PASSWORD'
    file_env 'MB_LDAP_BIND_DN'
}

docker_setup_env

# Initialize the Metabase db from H2 dump, if available
INITIAL_DB=$(ls /app/initial*.db 2> /dev/null | head -n 1)
if [ -f "${INITIAL_DB}" ]; then
    echo "Initializing Metabase database from H2 database ${INITIAL_DB}..."
    chmod o+r ${INITIAL_DB}
    exec java $JAVA_OPTS -jar /app/metabase.jar load-from-h2 ${INITIAL_DB%.mv.db} "$@"

    if [ $? -ne 0 ]; then
        echo "Failed to initialize database from H2 database!"
        exit 1
    fi

    echo "Done."
fi

# Launch the application
exec java $JAVA_OPTS -jar /app/metabase.jar "$@"