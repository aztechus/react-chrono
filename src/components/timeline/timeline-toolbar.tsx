import { FunctionComponent, useContext, useMemo } from 'react';
import { GlobalContext } from '../GlobalContext';
import Controls from '../timeline-elements/timeline-control/timeline-control';
import { Toolbar } from '../toolbar';
import {
  ChangeDensity,
  LayoutSwitcher,
  QuickJump,
} from './timeline-popover-elements';
import { TimelineToolbarProps } from './timeline-toolbar.model';
import { ExtraControlChild, ExtraControls } from './timeline.style';

const TimelineToolbar: FunctionComponent<TimelineToolbarProps> = ({
  activeTimelineItem,
  slideShowEnabled,
  slideShowRunning,
  flipLayout,
  toggleDarkMode,
  onPaused,
  onFirst,
  onLast,
  onNext,
  onPrevious,
  onRestartSlideshow,
  totalItems,
  items = [],
  id,
  onActivateTimelineItem,
  onUpdateTimelineMode,
  onUpdateTextContentDensity,
  mode,
}) => {
  const {
    theme,
    cardLess,
    enableQuickJump,
    darkMode,
    toolbarPosition,
    textDensity,
    isMobile,
    enableLayoutSwitch,
  } = useContext(GlobalContext);

  const disableLeft = useMemo(() => {
    return flipLayout
      ? activeTimelineItem === totalItems - 1
      : activeTimelineItem === 0;
  }, [flipLayout, activeTimelineItem, totalItems]);

  const disableRight = useMemo(() => {
    return flipLayout
      ? activeTimelineItem === 0
      : activeTimelineItem === totalItems - 1;
  }, [flipLayout, activeTimelineItem, totalItems]);

  const hideExtraControls = useMemo(() => cardLess || slideShowRunning, [
    cardLess,
    slideShowRunning,
  ]);

  const canShowDensity = useMemo(() => {
    return items.every((item) => item.cardDetailedText);
  }, [items]);

  const toolbarItems = useMemo(() => [
    {
      id: 'timeline-controls',
      label: 'Timeline Controls',
      name: 'timeline_control',
      onSelect: () => {},
    },
    {
      id: 'timeline-popover',
      label: 'timeline_popover',
      name: 'popover',
      onSelect: () => {},
    },
    {
      id: 'layout-popover',
      label: 'layout_popover',
      name: 'popover',
      onSelect: () => {},
    },
    {
      id: 'change-density',
      label: 'change_density',
      name: 'changeDensity',
      onSelect: () => {},
    },
  ], []);

  return (
    <Toolbar items={toolbarItems} theme={theme}>
      <Controls
        disableLeft={disableLeft}
        disableRight={disableRight}
        id={id}
        onFirst={onFirst}
        onLast={onLast}
        onNext={onNext}
        onPrevious={onPrevious}
        onReplay={onRestartSlideshow}
        slideShowEnabled={slideShowEnabled}
        slideShowRunning={slideShowRunning}
        isDark={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onPaused={onPaused}
      />
      <ExtraControls $hide={hideExtraControls} $slideShowRunning={slideShowRunning}>
        {enableQuickJump && (
          <ExtraControlChild className="quick-jump" key="quick-jump">
            <QuickJump
              activeItem={activeTimelineItem}
              isDarkMode={darkMode}
              items={items.map((item) => ({
                ...item,
                description: item.cardSubtitle,
                id: item.id,
                title: item.title,
              }))}
              onActivateItem={onActivateTimelineItem}
              theme={theme}
              position={toolbarPosition}
              isMobile={isMobile}
            />
          </ExtraControlChild>
        )}
        {!cardLess && enableLayoutSwitch && (
          <ExtraControlChild className="layout-switcher" key="layout-switcher">
            <LayoutSwitcher
              isDarkMode={darkMode}
              theme={theme}
              onUpdateTimelineMode={onUpdateTimelineMode}
              mode={mode}
              position={toolbarPosition}
              isMobile={isMobile}
            />
          </ExtraControlChild>
        )}
        {canShowDensity && (
          <ExtraControlChild className="change-density" key="change-density">
            <ChangeDensity
              isDarkMode={darkMode}
              theme={theme}
              onChange={onUpdateTextContentDensity}
              position={toolbarPosition}
              selectedDensity={textDensity}
              isMobile={isMobile}
            />
          </ExtraControlChild>
        )}
      </ExtraControls>
    </Toolbar>
  );
};

export { TimelineToolbar };