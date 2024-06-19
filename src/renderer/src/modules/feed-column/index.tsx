import { Logo } from "@renderer/components/icons/logo"
import { ActionButton } from "@renderer/components/ui/button"
import { ProfileButton } from "@renderer/components/user-button"
import { useNavigateEntry } from "@renderer/hooks/biz/useNavigateEntry"
import { APP_NAME, levels, views } from "@renderer/lib/constants"
import { stopPropagation } from "@renderer/lib/dom"
import { shortcuts } from "@renderer/lib/shortcuts"
import { clamp, cn } from "@renderer/lib/utils"
import { useWheel } from "@use-gesture/react"
import { m, useSpring } from "framer-motion"
import { Lethargy } from "lethargy"
import { useCallback, useEffect, useRef, useState } from "react"
import { isHotkeyPressed, useHotkeys } from "react-hotkeys-hook"
import { Link, useNavigate } from "react-router-dom"

import { Vibrancy } from "../../components/ui/background"
import { FeedList } from "./list"

const lethargy = new Lethargy()

export function FeedColumn() {
  const carouselRef = useRef<HTMLDivElement>(null)

  const [active, setActive] = useState(0)
  const spring = useSpring(0, {
    stiffness: 700,
    damping: 40,
  })

  useHotkeys(shortcuts.feeds.switchToView.key, (event) => {
    if (Number.parseInt(event.key) > 0) {
      setActive(Number.parseInt(event.key) - 1)
    } else if (isHotkeyPressed("Left") || isHotkeyPressed("Shift")) {
      setActive((i) => {
        if (i === 0) {
          return views.length - 1
        } else {
          return i - 1
        }
      })
    } else {
      setActive((i) => (i + 1) % views.length)
    }
    if (isHotkeyPressed("Tab")) {
      event.preventDefault()
    }
  }, { scopes: ["home"] })

  const routerNavigate = useNavigate()
  useHotkeys(shortcuts.feeds.add.key, () => {
    routerNavigate("/discover")
  }, { scopes: ["home"] })

  useWheel(
    ({ event, last, memo: wait = false, direction: [dx], delta: [dex] }) => {
      if (!last) {
        const s = lethargy.check(event)
        if (s) {
          if (!wait && Math.abs(dex) > 20) {
            setActive((i) => clamp(i + dx, 0, views.length - 1))
            return true
          } else {
            return
          }
        } else {
          return false
        }
      } else {
        return false
      }
    },
    {
      target: carouselRef,
    },
  )

  const normalStyle =
    !window.electron || window.electron.process.platform !== "darwin"

  const navigate = useNavigateEntry()

  useEffect(() => {
    spring.set(-active * 256)
    navigateBackHome()
  }, [active])

  const navigateBackHome = useCallback(() => {
    navigate({
      feedId: null,
      entryId: null,
      view: active,
      level: levels.view,
    })
  }, [active, navigate])
  return (
    <Vibrancy
      className="flex h-full flex-col gap-3 pt-2.5"
      onClick={navigateBackHome}
    >
      <div
        className={cn(
          "ml-5 mr-3 flex items-center",

          normalStyle ? "ml-4 justify-between" : "justify-end",
        )}
      >
        {normalStyle && (
          <div
            className="flex items-center gap-1 text-xl font-bold"
            onClick={(e) => {
              e.stopPropagation()

              navigateBackHome()
            }}
          >
            <Logo className="size-6" />
            {APP_NAME}
          </div>
        )}
        <div className="flex items-center gap-2" onClick={stopPropagation}>
          <ProfileButton method="modal" />
          <Link to="/discover">
            <ActionButton tooltip="Add">
              <i className="i-mgc-add-cute-re size-5 text-theme-vibrancyFg" />
            </ActionButton>
          </Link>
        </div>
      </div>

      <div
        className="flex w-full justify-between px-3 text-xl text-theme-vibrancyFg"
        onClick={stopPropagation}
      >
        {views.map((item, index) => (
          <ActionButton
            key={item.name}
            tooltip={item.name}
            className={cn(
              active === index && item.className,
              "flex items-center text-xl",
              "hover:!bg-theme-vibrancyBg",
            )}
            onClick={(e) => {
              setActive(index)
              e.stopPropagation()
            }}
          >
            {item.icon}
          </ActionButton>
        ))}
      </div>
      <div className="size-full overflow-hidden" ref={carouselRef}>
        <m.div className="flex h-full" style={{ x: spring }}>
          {views.map((item, index) => (
            <section
              key={item.name}
              className="shrink-0 snap-center overflow-y-auto"
            >
              <FeedList
                className="flex min-h-full w-64 flex-col px-3 pb-6 text-sm"
                view={index}
              />
            </section>
          ))}
        </m.div>
      </div>
    </Vibrancy>
  )
}