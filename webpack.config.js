// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");

const isProduction = process.env.NODE_ENV == "production";

const stylesHandler = "style-loader";

const config = {
  entry: {
      cotsMenu: "./ts/cotsMenu.ts",
      cotstag: "./ts/cotstag.ts",
      customButton: "./ts/customButton.ts",
      customCots: "./ts/customCots.ts",
      customPO: "./ts/customPO.ts",
      customRename: "./ts/customRename.ts",
      partsMenu: "./ts/partsMenu.ts",
      payload: "./ts/payload.ts",
      popup: "./ts/popup.ts",
      worktag: "./ts/worktag.ts",
  },
  output: {
    path: path.resolve(__dirname, "js/build"),
    filename: "[name].js"
  },
  plugins: [
    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
      },
      {
        test: /\.css$/i,
        use: [stylesHandler, "css-loader"],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: "asset",
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
