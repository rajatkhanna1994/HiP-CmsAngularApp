var fs = require('fs');
var path = require('canonical-path');
var _ = require('lodash');

/**
 * Protractor configuration.
 *
 * To run the tests do execute `npm run e2e` (need to execute `npm run webdriver:update` before).
 */

exports.config = {
  directConnect: false,

  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    browserName: 'chrome',
    chromeOptions: {
      args: [ "--headless", "--disable-gpu", "--window-size=800,600" ]
    }
  },

  // Framework to use. Jasmine is recommended.
  framework: 'jasmine',

  // Spec patterns are relative to this config file.
  specs: ['app/**/*.e2e-spec.js'],

  // For angular2 tests
  useAllAngular2AppRoots: true,

  // Base URL for application server
  baseUrl: 'http://localhost:8080',

  // doesn't seem to work.
  resultJsonOutputFile: './_test-output/results.json',

  onPrepare: function () {
    jasmine.getEnv().addReporter(new Reporter(browser.params));
    browser.internalIgnoreSynchronization = true;
  },

  jasmineNodeOpts: {
    defaultTimeoutInterval: 100000,
    print: function () {}
  }
};


// Custom reporter
function Reporter(options) {
  var _defaultOutputFile = path.resolve(process.cwd(), './_test-output', 'protractor-results.txt');
  options.outputFile = options.outputFile || _defaultOutputFile;

  initOutputFile(options.outputFile);
  options.appDir = options.appDir || './';
  var _root = {appDir: options.appDir, suites: []};
  log('AppDir: ' + options.appDir, +1);
  var _currentSuite;

  this.suiteStarted = function (suite) {
    _currentSuite = {description: suite.description, status: null, specs: []};
    _root.suites.push(_currentSuite);
    log('Suite: ' + suite.description, +1);
  };

  this.suiteDone = function (suite) {
    var statuses = _currentSuite.specs.map(function (spec) {
      return spec.status;
    });
    statuses = _.uniq(statuses);
    var status = statuses.indexOf('failed') >= 0 ? 'failed' : statuses.join(', ');
    _currentSuite.status = status;
    log('Suite ' + _currentSuite.status + ': ' + suite.description, -1);
  };

  this.specStarted = function (spec) {

  };

  this.specDone = function (spec) {
    var currentSpec = {
      description: spec.description,
      status: spec.status
    };
    if (spec.failedExpectations.length > 0) {
      currentSpec.failedExpectations = spec.failedExpectations;
    }

    _currentSuite.specs.push(currentSpec);
    log(spec.status + ' - ' + spec.description);
  };

  this.jasmineDone = function () {
    outputFile = options.outputFile;
    //// Alternate approach - just stringify the _root - not as pretty
    //// but might be more useful for automation.
    // var output = JSON.stringify(_root, null, 2);
    var output = formatOutput(_root);
    fs.appendFileSync(outputFile, output);
  };

  function initOutputFile(outputFile) {
    var header = "Protractor results for: " + (new Date()).toLocaleString() + "\n\n";
    if(!fs.existsSync(outputFile)) {
      fs.mkdirSync(path.dirname(outputFile));
    }
    fs.writeFileSync(outputFile, header);
  }

  // for output file output
  function formatOutput(output) {
    var indent = '  ';
    var pad = '  ';
    var results = [];
    results.push('AppDir:' + output.appDir);
    output.suites.forEach(function (suite) {
      results.push(pad + 'Suite: ' + suite.description + ' -- ' + suite.status);
      pad += indent;
      suite.specs.forEach(function (spec) {
        results.push(pad + spec.status + ' - ' + spec.description);
        if (spec.failedExpectations) {
          pad += indent;
          spec.failedExpectations.forEach(function (fe) {
            results.push(pad + 'message: ' + fe.message);
          });
          pad = pad.substr(2);
        }
      });
      pad = pad.substr(2);
      results.push('');
    });
    results.push('');
    return results.join('\n');
  }

  // for console output
  var _pad;

  function log(str, indent) {
    _pad = _pad || '';
    if (indent == -1) {
      _pad = _pad.substr(2);
    }
    console.log(_pad + str);
    if (indent == 1) {
      _pad = _pad + '  ';
    }
  }

}