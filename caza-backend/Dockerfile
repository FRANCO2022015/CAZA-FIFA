FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B verify

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/caza-backend-1.0.0.jar app.jar
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xms64m -Xmx256m -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError"
USER 10001
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
