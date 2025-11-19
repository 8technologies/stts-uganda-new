// npm install @apollo/server @as-integrations/express5 express graphql cors
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@as-integrations/express5";
import express from "express";
import http from "http";
import cors from "cors";
import { typeDefs, resolvers } from "./schema/index.js";
import { host, port } from "./config/config.js";
import authenticateUser from "./middleware/auth.js";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";

// Required logic for integrating with Express
const app = express();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.

app.use(express.static("public"));
app.use(cors({ origin: "*" }));
const httpServer = http.createServer(app);

// cointries api
app.get("/countries", async (req, res) => {
  try {
    const response = await fetch("https://www.apicountries.com/countries");
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Same ApolloServer initialization as before, plus the drain plugin
// for our httpServer.
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  csrfPrevention: true,
});
// Ensure we wait for our server to start
await server.start();

// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use(
  "/graphql",
  cors("*"),
  express.json(),
  graphqlUploadExpress(),
  // expressMiddleware accepts the same arguments:
  // an Apollo Server instance and optional configuration options
  expressMiddleware(server, {
    context: async ({ req, res }) => {
      const operationName = req.body.operationName;
      const exemptOperations = new Set([
        "Login",
        "IntrospectionQuery",
        "System_settings",
        "Register",
      ]);

      // token: req.headers.token

      if (!exemptOperations.has(operationName)) {
        await authenticateUser({ req });
      }

      return {
        req,
        res,
        // loaders: createLoaders(),
        // logUserAction: (params) =>
        //   logUserAction({
        //     ...params,
        //     ip_address: req.ip,
        //     user_agent: req.headers["user-agent"],
        //   }),
      };
    },
  })
);

// Modified server startup
await new Promise((resolve) => httpServer.listen({ port }, resolve));
console.log(`🚀 Server ready at http://${host}:${port}`);
