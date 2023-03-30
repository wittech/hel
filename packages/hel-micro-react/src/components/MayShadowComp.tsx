// @ts-nocheck
import { getGlobalThis, getHelEventBus } from 'hel-micro-core';
import React from 'react';
import defaults from '../consts/defaults';
import { useForceUpdate } from '../hooks/share';
import { getStaticShadowBodyRef } from '../wrap';
import type { AnyComp, AnyCompOrNull, IHelContext, IsLegacy, IUseRemoteCompOptions } from '../types';
import BuildInSkeleton from './BuildInSkeleton';
import ShadowBody, { getShadowBodyReadyEvName, tryMountStaticShadowBody } from './ShadowBody';
import ShadowViewV2 from './ShadowViewV2';

const { SHADOW_HOST_NAME, SHADOW_BODY_NAME } = defaults;

const bus = getHelEventBus();

export interface IMayShadowProps {
  platform: string;
  name: string;
  versionId: string;
  styleStr: string;
  compProps: any;
  Comp: AnyComp;
  setStyleAsString?: boolean;
  handleStyleStr?: (mayFetchedStr: string) => string;
  Skeleton?: AnyCompOrNull;
  styleUrlList?: string[];
  isLegacy?: IsLegacy;
  shadow?: boolean;
  shadowWrapStyle?: any;
  shadowDelay?: number;
  errMsg?: string;
  children?: any;
  reactRef?: any;
  createRoot?: IUseRemoteCompOptions['createRoot'];
  mountShadowBodyForRef?: IUseRemoteCompOptions['mountShadowBodyForRef'];
  ignoreHelContext?: IUseRemoteCompOptions['ignoreHelContext'];
}

function getPassedProps(
  helProps: IMayShadowProps,
  shadowAppRootRef: React.RefObject<any>,
  shadowBodyRootRef: React.RefObject<any>,
  staticShadowBodyRootRef: any,
) {
  // 供用户的  Select Picker Modal 等组件设置 Container 之用，以便安全的渲染到 shadow-dom 里
  const getShadowAppRoot = () => shadowAppRootRef.current || null;
  const getShadowBodyRoot = () => shadowBodyRootRef.current || null;
  const getStaticShadowBodyRoot = () => staticShadowBodyRootRef;
  const getEnsuredBodyRoot = () => getShadowBodyRoot() || getStaticShadowBodyRoot() || getGlobalThis()?.document.body || null;

  const { platform, name, versionId, compProps, isLegacy = false, ignoreHelContext = false } = helProps;
  const helContext: IHelContext = {
    platform,
    name,
    versionId,
    getShadowBodyRoot,
    getShadowAppRoot,
    getStaticShadowBodyRoot,
    getEnsuredBodyRoot,
  };

  let passedProps;
  if (isLegacy) {
    // getShadowContainer getShadowBodyContainer 作为历史方法暴露，让 MicroAppLegacy 载入老应用时不会报错
    Object.assign(helContext, { getShadowContainer: getShadowBodyRoot, getShadowBodyContainer: getShadowBodyRoot });
    passedProps = { appProps: compProps, children: compProps.children };
  } else {
    passedProps = compProps;
  }

  if (!ignoreHelContext) {
    // helContext 是关键属性key，不允许用户覆盖
    passedProps = { ...passedProps, helContext };
  }

  return passedProps;
}

function MayShadowComp(props: IMayShadowProps) {
  const {
    errMsg,
    name,
    platform,
    versionId,
    shadow,
    styleUrlList = [],
    styleStr,
    Comp,
    children,
    Skeleton,
    shadowWrapStyle = {},
    shadowDelay,
    reactRef, // 透传用户可能传递下来的 ref
    setStyleAsString,
    handleStyleStr,
  } = props;
  const platAndVer = { platform, versionId };
  const shadowAppRootRef = React.useRef(null);
  const shadowBodyRootRef = React.useRef(null);
  const forceUpdate = useForceUpdate();

  React.useEffect(() => {
    const staticRef = getStaticShadowBodyRef(name, platAndVer);
    if (shadow && !staticRef) {
      const evName = getShadowBodyReadyEvName(name);
      const evCb = () => {
        bus.off(evName, evCb);
        tryForceUpdate();
      };
      bus.on(evName, evCb);

      const renderProps = { id: name, delegatesFocus: true, styleSheets: styleUrlList, styleContent: styleStr };
      tryMountStaticShadowBody(renderProps, props.createRoot, platAndVer);
      return () => {
        bus.off(evName, evCb);
      };
    }
  }, []);

  const isShadowRefsReady = () => {
    const staticRef = getStaticShadowBodyRef(name, platAndVer);
    return shadowAppRootRef.current && (props.mountShadowBodyForRef ? shadowBodyRootRef.current : true) && staticRef;
  };
  const tryForceUpdate = () => {
    isShadowRefsReady() && forceUpdate();
  };

  const onShadowAppRootReady = (shadowRoot) => {
    shadowAppRootRef.current = shadowRoot;
    tryForceUpdate();
  };
  const onShadowBodyRootReady = (shadowRoot) => {
    shadowBodyRootRef.current = shadowRoot;
    tryForceUpdate();
  };
  const passedProps = getPassedProps(props, shadowAppRootRef, shadowBodyRootRef, getStaticShadowBodyRef(name, platAndVer));

  if (errMsg) {
    return React.createElement(Comp, passedProps);
  }

  let allProps = { ...passedProps, ref: reactRef };
  if (shadow) {
    // shawRoot 容器引用还未准备好时，继续骨架屏等待，
    // 确保 show 模式下透传给子组件的 helContext 的 getShadowAppRoot 方法一定能够活动 shawRoot 引用
    let TargetComp = Comp;
    if (!isShadowRefsReady()) {
      TargetComp = Skeleton || BuildInSkeleton;
      // 避免警告: Attempts to access this ref will fail
      allProps = {};
    }

    let finalStyleStr = '';
    let finalStyleUrlList = styleUrlList;
    if (setStyleAsString) {
      finalStyleStr = handleStyleStr?.(styleStr) || styleStr;
      finalStyleUrlList = [];
    }

    return (
      <>
        <ShadowViewV2
          id={name}
          tagName={SHADOW_HOST_NAME}
          delegatesFocus={true}
          style={shadowWrapStyle}
          styleSheets={finalStyleUrlList}
          styleContent={finalStyleStr}
          shadowDelay={shadowDelay}
          onShadowRootReady={onShadowAppRootReady}
        >
          <TargetComp {...allProps}>{children}</TargetComp>
        </ShadowViewV2>
        {/*
        在body上为子应用挂一个 shadow 容器，方便子应用的 Select Picker Modal 等组件设置 Container 时，
        可以调用 getShadowBodyRoot 来设置挂载节点，以确保它们也能够渲染到 shadow-dom 里，从而保证样式隔离
       */}
        <ShadowBody
          id={name}
          tagName={SHADOW_BODY_NAME}
          onShadowRootReady={onShadowBodyRootReady}
          delegatesFocus={true}
          styleSheets={finalStyleUrlList}
          styleContent={finalStyleStr}
        />
      </>
    );
  }

  return <Comp {...allProps}>{children}</Comp>;
}

export default MayShadowComp;
