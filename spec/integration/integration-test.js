var selenium = require('webdriver-sync');

describe('Basic use', function(){
  // Load the first example
  beforeEach(function(done) {
    this.driver = new selenium.FirefoxDriver();
    // For now, a local web server is assumed to be running
    // and serving the application.
    // (e.g. python -m SimpleHTTPServer)
    this.driver.get('http://localhost:8000/');
    this.driver.findElement(selenium.By.id('button-load')).
    click();
    done();
  });

  afterEach(function(done) {
    this.driver.quit();
    done();
  });

  it('Should open the first example', function(done){
    const url = this.driver.getCurrentUrl();
    expect(url).toContain('Matrix.html'); 
    done();
    });

  it('Should set the first column as header', function(done){
    //expand misc. menu -- brittle? Maybe 'important' elements should have an ID
    const menuExpander = this.driver.findElement(selenium.By.cssSelector('g.commandGroup:nth-child(2) > image:nth-child(9)')); 
    menuExpander.click();
    const headerButton = this.driver.findElement(selenium.By.cssSelector('g.commandGroup:nth-child(2) > g:nth-child(10) > g:nth-child(1) > image:nth-child(2)')); 
    headerButton.click();
    const firstColElement = this.driver.findElement(selenium.By.cssSelector('g.cell:nth-child(1) > text:nth-child(3)'));
    expect(firstColElement.getAttribute("innerHTML")).toBe('N');
    done();
  });
});

