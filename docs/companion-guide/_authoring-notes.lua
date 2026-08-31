--[[
  Authoring-only blocks: excluded from every public build.

  A block carrying the `authoring-note` class is production apparatus, not reader
  content: WIDGET-TODO anchors, unverified-figure notes, pilot notes, pending
  workshop material. The GPT ergonomics review (31 August 2026, Artifact 2
  finding 1) found these rendering as reader content in the published guide,
  which tells a ministry reader that some displayed claims may not have been
  reconciled.

  This filter deletes them from the abstract syntax tree, so they never reach the
  HTML, the PDF, or the search index. It is not CSS hiding: the text is gone.

  To read the notes, render with the authoring profile, which sets
  `authoring-notes: true` in _quarto-authoring.yml:

      quarto render docs/companion-guide --profile authoring

  Two markup forms are supported, because Quarto turns a callout into its own AST
  node before a Div filter sees it:

      ::: {.callout-warning .authoring-note}      a callout carrying the class
      :::: {.authoring-note}                      any block wrapped in a plain div
      ::::

  DRAFT FOR TEAL callouts are NOT authoring notes. They are visible by
  instruction, pending Teal's editorial pass, and must never carry this class.

  scripts/check_publication_safety.py enforces both halves: that no marker leaks
  into a public build, and that no marker in the source escapes the class.
]]

local keep = false

local function has_class(attr, name)
  if attr == nil or attr.classes == nil then
    return false
  end
  for _, c in ipairs(attr.classes) do
    if c == name then
      return true
    end
  end
  return false
end

function Meta(m)
  local v = m["authoring-notes"]
  if v ~= nil then
    if type(v) == "boolean" then
      keep = v
    else
      keep = (pandoc.utils.stringify(v) == "true")
    end
  end
  return m
end

function Div(el)
  if not keep and el.classes:includes("authoring-note") then
    return {}
  end
  return el
end

function Callout(el)
  if not keep and has_class(el.attr, "authoring-note") then
    return {}
  end
  return el
end

return { { Meta = Meta }, { Div = Div, Callout = Callout } }
