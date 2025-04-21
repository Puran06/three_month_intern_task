import weaviate from "weaviate-ts-client";
import 'dotenv/config';

const client = weaviate.client({
  scheme: process.env.WEAVIATE_SCHEME,
  host: process.env.WEAVIATE_HOST,
});

export default client;
