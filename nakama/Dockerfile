FROM heroiclabs/nakama:3.22.0

COPY ./config/local.yml /nakama/data/local.yml
COPY ./data/modules/build /nakama/data/modules/build

ENTRYPOINT ["/bin/sh", "-c"]

CMD ["nakama migrate up --database.address $DATABASE_URL && nakama --config /nakama/data/local.yml --database.address $DATABASE_URL"]