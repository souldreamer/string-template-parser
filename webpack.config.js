var webpack = require('webpack');
var path = require('path');
var yargs = require('yargs');
var dts = require('dts-bundle');
var deleteEmpty = require('delete-empty');
var os = require('os');
var nodeExternals = require('webpack-node-externals');
var del = require('del');

var libraryName = 'string-template-parser';
var plugins = [
	new webpack.ProgressPlugin(webpackStartEndHandler)
];
var outputFile;
var cleanInstall = yargs.argv.clean && true || false;

outputFile = 'index.js';

var config = {
	entry: [
		path.join(__dirname, '/src/index')
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
		loaders: [
			{ test: /\.ts$/, loader: 'ts-loader', exclude: [/node_modules/, /dist/, /tests/] }
		]
	},
	resolve: {
		extensions: ['.ts', '!.spec.ts']
	},
	plugins: plugins,
	externals: [nodeExternals()]
};

module.exports = config;

function webpackStartEndHandler(percentage, message) {
	if (percentage === 0) {
		// start
		if (cleanInstall) del.sync('dist');
	}
	if (percentage === 1) {
		// end
		console.log("Building .d.ts bundle");
		dts.bundle(dtsBundleOptions);
		console.log('Cleaning intermediate .d.ts files');
		deleteEmpty(dtsBundleOptions.baseDir, function (err, deletedFile) {
			if (err) {
				console.error('Couldn\'t delete: ' + err);
				throw err;
			}
			console.log('Deleted: ' + deletedFile);
		});

		// currently ts-loader emits declarations for ./tests too for some reason
		del.sync('dist/tests');
	}
}

var dtsBundleOptions = {
	name: libraryName,
	main: 'dist/dist/index.d.ts',
	baseDir: 'dist/dist',
	out: '../index.d.ts',
	externals: false,
	referenceExternals: false,
	removeSource: true,
	newline: os.EOL,
	indent: '\t',
	prefix: '',
	separator: '/',
	verbose: false,
	emitOnIncludedFileNotFound: false,
	emitOnNoIncludedFileNotFound: false,
	outputAsModuleFolder: false,
	headerPath: ''
};
