import { Scroll } from '@models/TimelineHorizontalModel';
import { TimelineCardModel } from '@models/TimelineItemModel';
import { TimelineModel } from '@models/TimelineModel';
import { getUniqueID } from '@utils/index';
import cls from 'classnames';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { GlobalContext } from '../GlobalContext';
import useNewScrollPosition from '../effects/useNewScrollPosition';
import TimelineHorizontal from '../timeline-horizontal/timeline-horizontal';
import TimelineVertical from '../timeline-vertical/timeline-vertical';
import { TimelineToolbar } from './timeline-toolbar';
import {
  Outline,
  TimelineContentRender,
  TimelineMain,
  TimelineMainWrapper,
  ToolbarWrapper,
  Wrapper,
} from './timeline.style';

const Timeline: React.FC<TimelineModel> = ({
  activeTimelineItem,
  contentDetailsChildren,
  iconChildren,
  items = [],
  onFirst,
  onLast,
  onNext,
  onPrevious,
  onRestartSlideshow,
  onTimelineUpdated,
  onItemSelected,
  onOutlineSelection,
  slideShowEnabled,
  slideShowRunning,
  mode = 'HORIZONTAL',
  nestedCardHeight,
  isChild = false,
  onPaused,
  uniqueId,
  noUniqueId,
  ...rest
}) => {
  const {
    cardPositionHorizontal,
    disableNavOnKey,
    flipLayout,
    itemWidth = 200,
    lineWidth,
    onScrollEnd,
    scrollable = true,
    showAllCardsHorizontal,
    theme,
    darkMode,
    toggleDarkMode,
    updateHorizontalAllCards,
    toolbarPosition,
    updateTextContentDensity,
    disableToolbar,
  } = useContext(GlobalContext);

  const [newOffSet, setNewOffset] = useNewScrollPosition(mode, itemWidth);
  const observer = useRef<IntersectionObserver | null>(null);
  const [hasFocus, setHasFocus] = useState(false);
  const horizontalContentRef = useRef<HTMLDivElement | null>(null);
  const [timelineMode, setTimelineMode] = useState(
    mode === 'HORIZONTAL' && showAllCardsHorizontal ? 'HORIZONTAL_ALL' : mode,
  );

  const activeItemIndex = useRef<number>(activeTimelineItem);

  const timelineMainRef = useRef<HTMLDivElement>(null);

  const canScrollTimeline = useMemo(() => {
    if (!slideShowRunning) {
      if (typeof scrollable === 'boolean') {
        return scrollable;
      }

      if (typeof scrollable === 'object' && scrollable.scrollbar) {
        return scrollable.scrollbar;
      }
    }
  }, [slideShowRunning, scrollable]);

  const id = useRef(
    `react-chrono-timeline-${noUniqueId ? uniqueId : getUniqueID()}`,
  );

  // Combined navigation handlers
  const handleNavigation = useCallback(
    (direction: 'next' | 'previous' | 'first' | 'last') => {
      if (hasFocus) {
        switch (direction) {
          case 'next':
            activeItemIndex.current = Math.min(
              activeItemIndex.current + 1,
              items.length - 1,
            );
            onNext?.();
            break;
          case 'previous':
            activeItemIndex.current = Math.max(
              activeItemIndex.current - 1,
              0,
            );
            onPrevious?.();
            break;
          case 'first':
            activeItemIndex.current = 0;
            onFirst?.();
            break;
          case 'last':
            activeItemIndex.current = items.length - 1;
            onLast?.();
            break;
          default:
            break;
        }
      }
    },
    [hasFocus, onNext, onPrevious, onFirst, onLast],
  );

  const handleKeySelection = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const { key } = event;

      if (mode === 'HORIZONTAL' && key === 'ArrowRight') {
        flipLayout ? handleNavigation('previous') : handleNavigation('next');
      } else if (mode === 'HORIZONTAL' && key === 'ArrowLeft') {
        flipLayout ? handleNavigation('next') : handleNavigation('previous');
      } else if (
        (mode === 'VERTICAL' || mode === 'VERTICAL_ALTERNATING') &&
        key === 'ArrowDown'
      ) {
        handleNavigation('next');
      } else if (
        (mode === 'VERTICAL' || mode === 'VERTICAL_ALTERNATING') &&
        key === 'ArrowUp'
      ) {
        handleNavigation('previous');
      } else if (key === 'Home') {
        handleNavigation('first');
      } else if (key === 'End') {
        handleNavigation('last');
      }
    },
    [handleNavigation, mode, flipLayout],
  );

  const handleTimelineItemClick = useCallback(
    (itemId?: string, isSlideShow?: boolean) => {
      if (itemId) {
        for (let idx = 0; idx < items.length; idx++) {
          if (items[idx].id === itemId) {
            activeItemIndex.current = idx;
            if (isSlideShow && idx < items.length - 1) {
              onTimelineUpdated?.(idx + 1);
            } else {
              onTimelineUpdated?.(idx);
            }
            break;
          }
        }
      }
    },
    [items, onTimelineUpdated],
  );

  // Combined effect for initial setup and updates
  useEffect(() => {
    const activeItem = items[activeTimelineItem || 0];

    if (slideShowRunning) {
      activeItemIndex.current = activeTimelineItem;
    }

    if (items.length && activeItem) {
      const { title, cardTitle, cardSubtitle, cardDetailedText } = activeItem;
      onItemSelected?.({
        cardDetailedText,
        cardSubtitle,
        cardTitle,
        index: activeItemIndex.current,
        title,
      });

      if (mode === 'HORIZONTAL') {
        const card = horizontalContentRef.current?.querySelector(
          `#timeline-card-${activeItem.id}`,
        );

        const cardRect = card?.getBoundingClientRect();
        const contentRect =
          horizontalContentRef.current?.getBoundingClientRect();

        if (cardRect && contentRect) {
          const { width: cardWidth, left: cardLeft } = cardRect;
          const { width: contentWidth, left: contentLeft } = contentRect;
          setTimeout(() => {
            const ele = horizontalContentRef.current as HTMLElement;
            ele.style.scrollBehavior = 'smooth';
            ele.scrollLeft +=
              cardLeft - contentLeft + cardWidth / 2 - contentWidth / 2;
          }, 100);
        }
      }
    }
  }, [activeTimelineItem, items.length, slideShowRunning, onItemSelected]);

  useEffect(() => {
    const ele = timelineMainRef.current;
    if (!ele) {
      return;
    }
    if (mode === 'HORIZONTAL') {
      ele.scrollLeft = Math.max(newOffSet, 0);
    } else {
      ele.scrollTop = newOffSet;
    }
  }, [newOffSet, mode]);

  useEffect(() => {
    const ele = timelineMainRef.current;
    if (!ele) {
      return;
    }
    // setup observer for the timeline elements
    setTimeout(() => {
      const childElements = ele.querySelectorAll('.vertical-item-row');
      Array.from(childElements).forEach((elem) => {
        if (observer.current) {
          observer.current.observe(elem);
        }
      });
    }, 0);

    const toggleMedia = (elem: HTMLElement, state: string) => {
      elem
        .querySelectorAll('img,video')
        .forEach(
          (ele) =>
          ((ele as HTMLElement).style.visibility =
            state === 'hide' ? 'hidden' : 'visible'),
        );
    };

    if (mode !== 'HORIZONTAL') {
      observer.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const element = entry.target as HTMLDivElement;
            if (entry.isIntersecting) {
              // show img and video when visible.
              toggleMedia(element, 'show');
            } else {
              // hide img and video when not visible.
              toggleMedia(element, 'hide');
              // pause YouTube embeds
              element.querySelectorAll('iframe').forEach((element) => {
                element.contentWindow?.postMessage(
                  '{"event":"command","func":"stopVideo","args":""}',
                  '*',
                );
              });
            }
          });
        },
        {
          root: timelineMainRef.current,
          threshold: 0,
        },
      );
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [mode]);

  const handleScroll = useCallback(
    (scroll: Partial<Scroll>) => {
      const element = timelineMainRef.current;
      if (element) {
        setNewOffset(element, scroll);
      }
    },
    [],
  );

  const handleKeyDown = useCallback(
    (evt: React.KeyboardEvent<HTMLDivElement>) => {
      if (!disableNavOnKey && !slideShowRunning) {
        setHasFocus(true);
        handleKeySelection(evt);
      }
    },
    [disableNavOnKey, slideShowRunning, handleKeySelection],
  );

  const handleTimelineUpdate = useCallback(
    (mode: string) => {
      if (mode === 'VERTICAL') {
        setTimelineMode('VERTICAL');
      } else if (mode === 'HORIZONTAL') {
        setTimelineMode('HORIZONTAL');
        updateHorizontalAllCards?.(false);
      } else if (mode === 'VERTICAL_ALTERNATING') {
        setTimelineMode('VERTICAL_ALTERNATING');
      } else if (mode === 'HORIZONTAL_ALL') {
        setTimelineMode('HORIZONTAL_ALL');
        updateHorizontalAllCards?.(true);
      }
    },
    [updateHorizontalAllCards],
  );

  const wrapperClass = useMemo(() => {
    return cls(mode.toLocaleLowerCase(), {
      'focus-visible': !isChild,
      'js-focus-visible': !isChild,
    });
  }, [mode, isChild]);

  const canShowToolbar = useMemo(() => {
    return !disableToolbar && !isChild;
  }, [disableToolbar, isChild]);

  return (
    <Wrapper
      onKeyDown={handleKeyDown}
      className={`${wrapperClass}`}
      cardPositionHorizontal={cardPositionHorizontal}
      onMouseDown={() => {
        setHasFocus(true);
      }}
      onKeyUp={(evt) => {
        if (evt.key === 'Escape') {
          onPaused?.();
        }
      }}
      {...rest}
    >
      {canShowToolbar ? (
        <ToolbarWrapper position={toolbarPosition}>
          <TimelineToolbar
            activeTimelineItem={activeTimelineItem}
            totalItems={items.length}
            slideShowEnabled={slideShowEnabled}
            slideShowRunning={slideShowRunning}
            onFirst={() => handleNavigation('first')}
            onLast={() => handleNavigation('last')}
            onNext={() => handleNavigation('next')}
            onPrevious={() => handleNavigation('previous')}
            onRestartSlideshow={onRestartSlideshow}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            onPaused={onPaused}
            id={id.current}
            flipLayout={flipLayout}
            items={items}
            onActivateTimelineItem={handleTimelineItemClick}
            onUpdateTimelineMode={handleTimelineUpdate}
            onUpdateTextContentDensity={updateTextContentDensity}
            mode={timelineMode}
          />
        </ToolbarWrapper>
      ) : null}
      <TimelineMainWrapper
        ref={timelineMainRef}
        $scrollable={canScrollTimeline}
        className={`${mode.toLowerCase()} timeline-main-wrapper`}
        id="timeline-main-wrapper"
        data-testid="timeline-main-wrapper"
        theme={theme}
        mode={mode}
        position={toolbarPosition}
        onScroll={(ev) => {
          const target = ev.target as HTMLElement;
          let scrolled = 0;

          if (mode === 'VERTICAL' || mode === 'VERTICAL_ALTERNATING') {
            scrolled = target.scrollTop + target.clientHeight;

            if (target.scrollHeight - scrolled < 1) {
              onScrollEnd?.();
            }
          } else {
            scrolled = target.scrollLeft + target.offsetWidth;

            if (target.scrollWidth === scrolled) {
              onScrollEnd?.();
            }
          }
        }}
      >
        {/* VERTICAL ALTERNATING */}
        {timelineMode === 'VERTICAL_ALTERNATING' ? (
          <TimelineVertical
            activeTimelineItem={activeTimelineItem}
            autoScroll={handleScroll}
            contentDetailsChildren={contentDetailsChildren}
            hasFocus={hasFocus}
            iconChildren={iconChildren}
            items={items as TimelineCardModel[]}
            mode={timelineMode}
            onClick={handleTimelineItemClick}
            onElapsed={(itemId?: string) =>
              handleTimelineItemClick(itemId, true)
            }
            onOutlineSelection={onOutlineSelection}
            slideShowRunning={slideShowRunning}
            theme={theme}
            nestedCardHeight={nestedCardHeight}
          />
        ) : null}

        {/* HORIZONTAL */}
        {timelineMode === 'HORIZONTAL' || timelineMode === 'HORIZONTAL_ALL' ? (
          <TimelineMain className={mode.toLowerCase()}>
            <Outline color={theme && theme.primary} height={lineWidth} />
            <TimelineHorizontal
              autoScroll={handleScroll}
              contentDetailsChildren={contentDetailsChildren}
              handleItemClick={handleTimelineItemClick}
              hasFocus={hasFocus}
              iconChildren={iconChildren}
              items={items as TimelineCardModel[]}
              mode={timelineMode}
              onElapsed={(itemId?: string) =>
                handleTimelineItemClick(itemId, true)
              }
              slideShowRunning={slideShowRunning}
              wrapperId={id.current}
              nestedCardHeight={nestedCardHeight}
            />
          </TimelineMain>
        ) : null}

        {/* VERTICAL */}
        {timelineMode === 'VERTICAL' ? (
          <TimelineVertical
            activeTimelineItem={activeTimelineItem}
            alternateCards={false}
            autoScroll={handleScroll}
            contentDetailsChildren={contentDetailsChildren}
            hasFocus={hasFocus}
            iconChildren={iconChildren}
            items={items as TimelineCardModel[]}
            mode={mode}
            onClick={handleTimelineItemClick}
            onElapsed={(itemId?: string) =>
              handleTimelineItemClick(itemId, true)
            }
            onOutlineSelection={onOutlineSelection}
            slideShowRunning={slideShowRunning}
            theme={theme}
            nestedCardHeight={nestedCardHeight}
          />
        ) : null}
      </TimelineMainWrapper>
      <TimelineContentRender
        id={id.current}
        $showAllCards={showAllCardsHorizontal}
        ref={horizontalContentRef}
      />
    </Wrapper>
  );
};

Timeline.displayName = 'Timeline';

export default Timeline;