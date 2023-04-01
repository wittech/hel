import * as core from 'hel-micro-core';
import * as apis from './apis';
import { createInstance } from './ins';
export type { LocalCompType, MicroAppType } from './components/MicroApp';
export type {
  GetSubVal,
  IHelContext,
  IHelProps,
  ILocalCompProps,
  IMicroAppLegacyProps,
  IMicroAppProps,
  IUseRemoteCompOptions,
  IUseRemoteLibCompOptions,
} from './types';
export { createInstance };

export const {
  VER,
  ShadowView,
  ShadowBody,
  MicroApp,
  MicroAppLegacy,
  MicroAppLegacyMemo,
  LocalComp,
  BuildInSkeleton,
  renderApp,
  getMayStaticShadowNode,
  useExecuteCallbackOnce,
  useForceUpdate,
  useRemoteComp,
  useRemotePureComp,
  useRemoteCompAndSubVal,
  useRemote2Comps,
  useRemoteLibComp,
  useRemotePureLibComp,
  useRemoteLegacyComp,
} = apis;

core.log(`hel-micro-react ver ${VER}`);

const toExport = {
  VER,
  ShadowView,
  ShadowBody,
  MicroApp,
  MicroAppLegacy,
  MicroAppLegacyMemo,
  LocalComp,
  BuildInSkeleton,
  renderApp,
  getMayStaticShadowNode,
  useExecuteCallbackOnce,
  useForceUpdate,
  useRemoteComp,
  useRemotePureComp,
  useRemoteCompAndSubVal,
  useRemote2Comps,
  useRemoteLibComp,
  useRemotePureLibComp,
  useRemoteLegacyComp,
  createInstance,
};

export default toExport;
