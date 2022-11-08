import { AbstractModule } from 'adapt-authoring-core';
import child_process from 'child_process';
import { promisify } from 'node:util';
const exec = promisify(child_process.exec);
/**
 * Makes sure browserslist is up to date for the framework build process
 * @extends {AbstractModule}
 */
class BrowserslistModule extends AbstractModule {
  /** @override */
  async init() {
    this.framework = await this.app.waitForModule('adaptframework');
    this.runOnBuild = this.getConfig('runOnBuild');
    this.updateInterval = this.getConfig('updateInterval');

    if(this.runOnBuild) this.framework.preBuildHook.tap(this.update.bind(this));
    if(this.updateInterval > 0) setInterval(() => this.update(true), this.updateInterval);
  }
  async update(handleError = false) {
    try {
      await exec('npx browserslist@latest --update-db', { cwd: this.framework.path });
    } catch(e) {
      const error = this.app.errors.BROWSERSLIST_UPDATE_FAILED.setData({ error: e.message });
      if(!handleError) throw error;
      this.log('error', error);
    }
  }
}

export default BrowserslistModule;