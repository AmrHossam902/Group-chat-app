
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {

    mode: "production",
    entry: {
        app: {
            import: './components/app/app.component.js'
        }
    },
    output: {
        filename: 'js/[name].js',
    },
    module: {
        rules: [
            {
                test: /\.js?/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets : ["@babel/preset-env", "@babel/preset-react"]
                    }
                }
            },
            {
                test: /\.css?/,
                use: [MiniCssExtractPlugin.loader, 'css-loader']
            }
        ]
    },
    optimization:{
        runtimeChunk: 'single',
        splitChunks:{
            chunks:'all'
        }
    },
    plugins: [
        new MiniCssExtractPlugin({"filename":"css/[name].css"}),
        new HtmlWebpackPlugin({
            "publicPath": "/",
            "filename" : "views/app.html",
            "chunks" : ["app"],
            "template" : "./components/template.html"
        })
    ]

}