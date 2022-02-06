-- updatenote.lua, generated on 2/6/2022 12:49:31 AM, to notify about version 2.0.0
local ass_start = mp.get_property_osd("osd-ass-cc/0")
local ass_stop = mp.get_property_osd("osd-ass-cc/1")
function notification()
    mp.osd_message(ass_start .. "{\\c&H0cff00&}Version 2.0.0 is available! Update via Menu --> Preferences." .. ass_stop,4)
end
mp.register_event("file-loaded", notification)
