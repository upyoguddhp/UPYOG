
FROM egovio/alpine-maven-builder-jdk-8:1-master-NA-6036091e AS build  
ARG WORK_DIR
WORKDIR /app

# copy the project files
COPY ${WORK_DIR}/pom.xml ./pom.xml
COPY build/maven/start.sh ./start.sh

# not useful for stateless builds
# RUN mvn -B dependency:go-offline

COPY ${WORK_DIR}/src ./src
RUN mvn -B -f /app/pom.xml package -Dmaven.test.skip=true -DskipTests


# Create runtime image
FROM egovio/8-openjdk-alpine


WORKDIR /opt/egov

COPY --from=build /app/target/*.jar /app/start.sh /opt/egov/

RUN chmod +x /opt/egov/start.sh

# Trust the eMudhra CA chain that signs *.citizenseva.hp.gov.in (absent from the JDK 8 base image's cacerts);
# needed for HTTPS calls to Superset. Public CA certificates only.
COPY build/maven/certs /tmp/certs
RUN CACERTS="$(find /usr /opt -name cacerts -path '*security*' 2>/dev/null | head -1)" \
 && echo "Importing CA certs into $CACERTS" \
 && for f in /tmp/certs/*.pem; do \
      keytool -importcert -noprompt -trustcacerts -keystore "$CACERTS" -storepass changeit -alias "$(basename "$f" .pem)" -file "$f"; \
    done \
 && rm -rf /tmp/certs

CMD ["/opt/egov/start.sh"]
