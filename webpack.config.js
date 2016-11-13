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
var cleanInstall = false;

if (yargs.argv.p) {
	plugins.push(new webpack.optimize.UglifyJsPlugin({ minimize: true }));
	outputFile = libraryName + '.min.js';
} else {
	outputFile = libraryName + '.js';
}
if (yargs.argv.clean) {
	cleanInstall = true;
}

var config = {
	entry: [
		path.join(__dirname, '/src/index.ts')
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
			{ test: /\.ts$/, loader: 'ts', exclude: [/node_modules/, /dist/, /tests/] }
		]
	},
	resolve: {
		root: path.resolve('./src'),
		extensions: [ '', '.ts', '!.spec.ts' ]
	},
	plugins: plugins,
	externals: [nodeExternals()],

	ts: {
		compilerOptions: {
			declaration: true
		}
	}
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
		deleteEmpty(dtsBundleOptions.baseDir, function(err, deletedFile) {
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
	main: 'dist/src/index.d.ts',
	baseDir: 'dist/src',
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
	outputAsModuleFolder: false
};
