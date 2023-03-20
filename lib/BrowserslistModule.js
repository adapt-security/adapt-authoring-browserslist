import { AbstractModule } from 'adapt-authoring-core'
import childProcess from 'child_process'
import { promisify } from 'node:util'
const exec = promisify(childProcess.exec)
/**
 * Makes sure browserslist is up to date for the framework build process
 * @memberof browserslist
 * @extends {AbstractModule}
 */
class BrowserslistModule extends AbstractModule {
  /** @override */
  async init () {
    const framework = await this.app.waitForModule('adaptframework')

    this.path = framework.path
    this.runOnBuild = this.getConfig('runOnBuild')
    this.updateInterval = this.getConfig('updateInterval')

    if (this.runOnBuild) framework.preBuildHook.tap(this.update.bind(this))
    if (this.updateInterval > 0) setInterval(() => this.update(true), this.updateInterval)
  }

  async update (handleError = false) {
    try {
      await exec('npx browserslist@latest --update-db', { cwd: this.path })
    } catch (e) {
      const error = this.app.errors.BROWSERSLIST_UPDATE_FAILED.setData({ error: e.message })
      if (!handleError) throw error
      this.log('error', error)
    }
  }
}

export default BrowserslistModule
