# Multi-stage build do backend do Drone Kairós ERP (doc 19 — DevOps)
# Estágio 1: build
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

# Estágio 2: runtime enxuto
FROM eclipse-temurin:21-jre
WORKDIR /app
# Usuário não-root (hardening — doc 14/KCD)
RUN useradd -r -u 1001 kairos
COPY --from=build /app/target/kairos-erp-*.jar app.jar
USER kairos
EXPOSE 8080
ENV JAVA_OPTS=""
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar app.jar"]
