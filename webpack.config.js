var webpack = require('webpack'),
	path = require('path'),
	yargs = require('yargs');

var libraryName = 'string-template-parser',
	plugins = [],
	outputFile;

if (yargs.argv.p) {
	plugins.push(new webpack.optimize.UglifyJsPlugin({ minimize: true }));
	outputFile = libraryName + '.min.js';
} else {
	outputFile = libraryName + '.js';
}

var config = {
	entry: [
		__dirname + '/src/index.ts'
	],
	devtool: 'source-map',
	output: {
		path: path.join(__dirname, '/dist'),
		filename: outputFile,
		library: libraryName,
		libraryTarget: 'umd',
		umdNamedDefine: true
	},
	module: {
//		preLoaders: [
//			{ test: /\.ts$/, loader: 'tslint', exclude: /node_modules/ }
//      ],
		loaders: [
			{ test: /\.ts$/, loader: 'ts', exclude: /node_modules/ }
		]
	},
	resolve: {
		root: path.resolve('./src'),
		extensions: [ '', '.ts' ]
	},
	plugins: plugins//,

	// Individual Plugin Options
//	tslint: {
//		emitErrors: true,
//		failOnHint: true
//	}
};

module.exports = config;