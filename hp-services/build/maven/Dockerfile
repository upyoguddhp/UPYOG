
# JDK8 by default (patched builder trusts upyog-nexus cert); build_push.py overrides both for Java 17 modules
ARG BUILDER_IMAGE=upyoguddhp/alpine-maven-builder-jdk-8:1-sectigo
ARG RUNTIME_IMAGE=egovio/8-openjdk-alpine
FROM ${BUILDER_IMAGE} AS build
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
FROM ${RUNTIME_IMAGE}
WORKDIR /opt/egov

COPY --from=build /app/target/*.jar /app/start.sh /opt/egov/

RUN chmod +x /opt/egov/start.sh

CMD ["/opt/egov/start.sh"]
