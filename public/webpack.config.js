// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        main: './src/util/app.js',
        admin: './src/util/admin.js',
        auth: './src/util/auth.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
        assetModuleFilename: 'assets/[hash][ext][query]',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: { loader: 'babel-loader' }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                type: 'asset/resource'
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
            filename: 'index.html',
            chunks: ['main', 'vendor'],
            favicon: './src/assets/favicon.png'
        }),
        new HtmlWebpackPlugin({
            template: './src/page/admin.html',
            filename: 'admin.html',
            chunks: ['admin', 'vendor'],
            favicon: './src/assets/favicon.png'
        }),
        new HtmlWebpackPlugin({
            template: './src/page/login.html',
            filename: 'login.html',
            chunks: ['auth', 'vendor'],
            favicon: './src/assets/favicon.png'
        }),
    ],
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendor',
                    chunks: 'all',
                },
            },
        },
    },
    devServer: {
        static: path.resolve(__dirname, 'dist'),
        port: 3000,
        open: true,
        hot: true
    },
    devtool: 'eval-source-map',
    //mode: 'development'
    mode: 'production'
};
