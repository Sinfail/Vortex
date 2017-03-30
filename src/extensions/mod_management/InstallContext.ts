import { addNotification, dismissNotification } from '../../actions/notifications';
import { INotification } from '../../types/INotification';
import { log } from '../../util/log';
import { showError } from '../../util/message';

import { addMod, removeMod, setModAttribute,
         setModInstallationPath, setModState } from './actions/mods';
import { IMod, ModState } from './types/IMod';

import { IInstallContext, InstallOutcome } from './types/IInstallContext';

import * as path from 'path';

interface IOnAddMod {
  (mod: IMod): void;
}

interface IOnAddNotification {
  (notification: INotification): void;
}

class InstallContext implements IInstallContext {

  private mAddMod: (mod: IMod) => void;
  private mRemoveMod: (modId: string) => void;
  private mAddNotification: (notification: INotification) => void;
  private mDismissNotification: (id: string) => void;
  private mShowError: (message: string, details?: string | Error) => void;
  private mSetModState: (id: string, state: ModState) => void;
  private mSetModAttribute: (id: string, key: string, value: any) => void;
  private mSetModInstallationPath: (id: string, installPath: string) => void;

  private mAddedId: string;
  private mIndicatorId: string;
  private mInstallOutcome: InstallOutcome;

  constructor(gameMode: string, dispatch: Redux.Dispatch<any>) {
    this.mAddMod = (mod) => dispatch(addMod(gameMode, mod));
    this.mRemoveMod = (modId) => dispatch(removeMod(gameMode, modId));
    this.mAddNotification = (notification) =>
      dispatch(addNotification(notification));
    this.mDismissNotification = (id) =>
      dispatch(dismissNotification(id));
    this.mShowError = (message, details?) =>
      showError(dispatch, message, details);
    this.mSetModState = (id, state) =>
      dispatch(setModState(gameMode, id, state));
    this.mSetModAttribute = (id, key, value) =>
      dispatch(setModAttribute(gameMode, id, key, value));
    this.mSetModInstallationPath = (id, installPath) =>
      dispatch(setModInstallationPath(gameMode, id, installPath));
  }

  public startIndicator(id: string): void {
    this.mAddNotification({
      id: 'install_' + id,
      message: 'Installing ' + id,
      type: 'activity',
    });
    this.mIndicatorId = id;
  }

  public stopIndicator(): void {
    if (this.mIndicatorId === undefined) {
      return;
    }

    this.mDismissNotification('install_' + this.mIndicatorId);

    this.mAddNotification(this.outcomeNotification(this.mInstallOutcome, this.mIndicatorId));
  }

  public startInstallCB(id: string, archiveId: string): void {
    this.mAddMod({
      id,
      archiveId,
      installationPath: id,
      state: 'installing',
      attributes: {
        name: id,
        installTime: 'ongoing',
      },
    });
    this.mAddedId = id;
  }

  public finishInstallCB(outcome: InstallOutcome, info?: any): void {
    if (outcome === 'success') {
      this.mSetModState(this.mAddedId, 'installed');
      this.mSetModAttribute(this.mAddedId, 'installTime', new Date());
      this.mSetModAttribute(this.mAddedId, 'category', info.category);
      this.mSetModAttribute(this.mAddedId, 'version', info.version);
      this.mSetModAttribute(this.mAddedId, 'fileId', info.fileId);
      this.mSetModAttribute(this.mAddedId, 'newestFileId', info.fileId);
      this.mSetModAttribute(this.mAddedId, 'changelogHtml', info.changelogHtml);
      this.mSetModAttribute(this.mAddedId, 'endorsed', '');
      this.mSetModAttribute(this.mAddedId, 'bugMessage', '');

      if (info !== undefined) {
        Object.keys(info).forEach(
          (key: string) => { this.mSetModAttribute(this.mAddedId, key, info[key]); });
      }
    } else {
      if (this.mAddedId !== undefined) {
        this.mRemoveMod(this.mAddedId);
      }
    }
    this.mInstallOutcome = outcome;
  }

  public setInstallPathCB(id: string, installPath: string) {
    this.mSetModInstallationPath(id, path.basename(installPath));
  }

  public reportError(message: string, details?: string | Error): void {
    log('error', 'install error', { message, details });
    this.mShowError(message, details);
  }

  public progressCB(percent: number, file: string): void {
    log('debug', 'install progress', { percent, file });
  }

  private outcomeNotification(outcome: InstallOutcome, id: string): INotification {
    switch (outcome) {
      case 'success': return {
        type: 'success',
        message: `${id} installed`,
        displayMS: 4000,
      };
      case 'canceled': return {
        type: 'info',
        message: 'Installation canceled',
        displayMS: 2000,
      };
      default: return {
        type: 'error',
        message: `${id} failed to install`,
      };
    }
  }
}

export default InstallContext;
