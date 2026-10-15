<<<<<<< HEAD
FROM upyogio/flyway:4.1.2
=======
FROM upyogio/flyway:10.7.1
>>>>>>> niua-upstream/niua-dev-2.0

COPY ./migration/ddl /flyway/sql

COPY migrate.sh /usr/bin/migrate.sh

RUN chmod +x /usr/bin/migrate.sh

<<<<<<< HEAD
CMD ["/usr/bin/migrate.sh"]
=======
ENTRYPOINT ["/usr/bin/migrate.sh"]
>>>>>>> niua-upstream/niua-dev-2.0
