import { AppPage } from './app.po';
import { browser, logging } from 'protractor';

describe('workspace-project App', () => {
  let page: AppPage;

  beforeEach(() => {
    // disable because we constantly poll in the background
    browser.waitForAngularEnabled(false);
    page = new AppPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getTitleText()).toEqual('MobSOS Evaluation Center');
  });

  afterEach(async () => {
    // Commented, because we have no test server we could use
    // Uncomment when such a server is available

    // Assert that there are no errors emitted from the browser
    /*const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    } as logging.Entry));*/
  });
});
