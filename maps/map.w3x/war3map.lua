gg_trg_Untitled_Trigger_001 = nil
function InitGlobals()
end

function Trig_Untitled_Trigger_001_Actions()
end

function InitTrig_Untitled_Trigger_001()
gg_trg_Untitled_Trigger_001 = CreateTrigger()
TriggerAddAction(gg_trg_Untitled_Trigger_001, Trig_Untitled_Trigger_001_Actions)
end

function InitCustomTriggers()
InitTrig_Untitled_Trigger_001()
end

function InitUpgrades_Player0()
SetPlayerTechResearched(Player(0), FourCC("Remg"), 1)
SetPlayerTechResearched(Player(0), FourCC("Rune"), 2)
SetPlayerTechResearched(Player(0), FourCC("Rows"), 1)
end

function InitUpgrades_Player1()
SetPlayerTechResearched(Player(1), FourCC("Remg"), 1)
SetPlayerTechResearched(Player(1), FourCC("Rune"), 2)
SetPlayerTechResearched(Player(1), FourCC("Rows"), 1)
end

function InitUpgrades_Player2()
SetPlayerTechResearched(Player(2), FourCC("Remg"), 1)
SetPlayerTechResearched(Player(2), FourCC("Rune"), 2)
SetPlayerTechResearched(Player(2), FourCC("Rows"), 1)
end

function InitUpgrades_Player3()
SetPlayerTechResearched(Player(3), FourCC("Remg"), 1)
SetPlayerTechResearched(Player(3), FourCC("Rune"), 2)
SetPlayerTechResearched(Player(3), FourCC("Rows"), 1)
end

function InitUpgrades_Player4()
SetPlayerTechResearched(Player(4), FourCC("Remg"), 1)
SetPlayerTechResearched(Player(4), FourCC("Rune"), 2)
SetPlayerTechResearched(Player(4), FourCC("Rows"), 1)
end

function InitUpgrades_Player5()
SetPlayerTechResearched(Player(5), FourCC("Remg"), 1)
SetPlayerTechResearched(Player(5), FourCC("Rune"), 2)
SetPlayerTechResearched(Player(5), FourCC("Rows"), 1)
end

function InitUpgrades_Player6()
SetPlayerTechResearched(Player(6), FourCC("Remg"), 1)
SetPlayerTechResearched(Player(6), FourCC("Rune"), 2)
SetPlayerTechResearched(Player(6), FourCC("Rows"), 1)
end

function InitUpgrades_Player7()
SetPlayerTechResearched(Player(7), FourCC("Remg"), 1)
SetPlayerTechResearched(Player(7), FourCC("Rune"), 2)
SetPlayerTechResearched(Player(7), FourCC("Rows"), 1)
end

function InitUpgrades_Player8()
SetPlayerTechResearched(Player(8), FourCC("Remg"), 1)
SetPlayerTechResearched(Player(8), FourCC("Rune"), 2)
SetPlayerTechResearched(Player(8), FourCC("Rows"), 1)
end

function InitUpgrades()
InitUpgrades_Player0()
InitUpgrades_Player1()
InitUpgrades_Player2()
InitUpgrades_Player3()
InitUpgrades_Player4()
InitUpgrades_Player5()
InitUpgrades_Player6()
InitUpgrades_Player7()
InitUpgrades_Player8()
end

function InitTechTree_Player0()
SetPlayerTechMaxAllowed(Player(0), FourCC("ostr"), 0)
SetPlayerTechMaxAllowed(Player(0), FourCC("hC63"), 0)
end

function InitTechTree_Player1()
SetPlayerTechMaxAllowed(Player(1), FourCC("ostr"), 0)
SetPlayerTechMaxAllowed(Player(1), FourCC("hC63"), 0)
end

function InitTechTree_Player2()
SetPlayerTechMaxAllowed(Player(2), FourCC("ostr"), 0)
SetPlayerTechMaxAllowed(Player(2), FourCC("hC63"), 0)
end

function InitTechTree_Player3()
SetPlayerTechMaxAllowed(Player(3), FourCC("ostr"), 0)
SetPlayerTechMaxAllowed(Player(3), FourCC("hC63"), 0)
end

function InitTechTree_Player4()
SetPlayerTechMaxAllowed(Player(4), FourCC("ostr"), 0)
SetPlayerTechMaxAllowed(Player(4), FourCC("hC63"), 0)
end

function InitTechTree_Player5()
SetPlayerTechMaxAllowed(Player(5), FourCC("ostr"), 0)
SetPlayerTechMaxAllowed(Player(5), FourCC("hC63"), 0)
end

function InitTechTree_Player6()
SetPlayerTechMaxAllowed(Player(6), FourCC("ostr"), 0)
end

function InitTechTree_Player7()
SetPlayerTechMaxAllowed(Player(7), FourCC("ostr"), 0)
end

function InitTechTree_Player8()
SetPlayerTechMaxAllowed(Player(8), FourCC("ostr"), 0)
end

function InitTechTree_Player11()
SetPlayerTechMaxAllowed(Player(11), FourCC("ostr"), 0)
end

function InitTechTree()
InitTechTree_Player0()
InitTechTree_Player1()
InitTechTree_Player2()
InitTechTree_Player3()
InitTechTree_Player4()
InitTechTree_Player5()
InitTechTree_Player6()
InitTechTree_Player7()
InitTechTree_Player8()
InitTechTree_Player11()
end

function InitCustomPlayerSlots()
SetPlayerStartLocation(Player(0), 0)
ForcePlayerStartLocation(Player(0), 0)
SetPlayerColor(Player(0), ConvertPlayerColor(0))
SetPlayerRacePreference(Player(0), RACE_PREF_HUMAN)
SetPlayerRaceSelectable(Player(0), false)
SetPlayerController(Player(0), MAP_CONTROL_USER)
SetPlayerStartLocation(Player(1), 1)
ForcePlayerStartLocation(Player(1), 1)
SetPlayerColor(Player(1), ConvertPlayerColor(1))
SetPlayerRacePreference(Player(1), RACE_PREF_HUMAN)
SetPlayerRaceSelectable(Player(1), false)
SetPlayerController(Player(1), MAP_CONTROL_USER)
SetPlayerStartLocation(Player(2), 2)
ForcePlayerStartLocation(Player(2), 2)
SetPlayerColor(Player(2), ConvertPlayerColor(2))
SetPlayerRacePreference(Player(2), RACE_PREF_HUMAN)
SetPlayerRaceSelectable(Player(2), false)
SetPlayerController(Player(2), MAP_CONTROL_USER)
SetPlayerStartLocation(Player(3), 3)
ForcePlayerStartLocation(Player(3), 3)
SetPlayerColor(Player(3), ConvertPlayerColor(3))
SetPlayerRacePreference(Player(3), RACE_PREF_HUMAN)
SetPlayerRaceSelectable(Player(3), false)
SetPlayerController(Player(3), MAP_CONTROL_USER)
SetPlayerStartLocation(Player(4), 4)
ForcePlayerStartLocation(Player(4), 4)
SetPlayerColor(Player(4), ConvertPlayerColor(4))
SetPlayerRacePreference(Player(4), RACE_PREF_HUMAN)
SetPlayerRaceSelectable(Player(4), false)
SetPlayerController(Player(4), MAP_CONTROL_USER)
SetPlayerStartLocation(Player(5), 5)
ForcePlayerStartLocation(Player(5), 5)
SetPlayerColor(Player(5), ConvertPlayerColor(5))
SetPlayerRacePreference(Player(5), RACE_PREF_HUMAN)
SetPlayerRaceSelectable(Player(5), false)
SetPlayerController(Player(5), MAP_CONTROL_USER)
SetPlayerStartLocation(Player(6), 6)
ForcePlayerStartLocation(Player(6), 6)
SetPlayerColor(Player(6), ConvertPlayerColor(6))
SetPlayerRacePreference(Player(6), RACE_PREF_HUMAN)
SetPlayerRaceSelectable(Player(6), false)
SetPlayerController(Player(6), MAP_CONTROL_USER)
SetPlayerStartLocation(Player(7), 7)
ForcePlayerStartLocation(Player(7), 7)
SetPlayerColor(Player(7), ConvertPlayerColor(7))
SetPlayerRacePreference(Player(7), RACE_PREF_HUMAN)
SetPlayerRaceSelectable(Player(7), false)
SetPlayerController(Player(7), MAP_CONTROL_USER)
SetPlayerStartLocation(Player(8), 8)
ForcePlayerStartLocation(Player(8), 8)
SetPlayerColor(Player(8), ConvertPlayerColor(8))
SetPlayerRacePreference(Player(8), RACE_PREF_HUMAN)
SetPlayerRaceSelectable(Player(8), false)
SetPlayerController(Player(8), MAP_CONTROL_USER)
SetPlayerStartLocation(Player(9), 9)
ForcePlayerStartLocation(Player(9), 9)
SetPlayerColor(Player(9), ConvertPlayerColor(9))
SetPlayerRacePreference(Player(9), RACE_PREF_HUMAN)
SetPlayerRaceSelectable(Player(9), false)
SetPlayerController(Player(9), MAP_CONTROL_USER)
SetPlayerStartLocation(Player(10), 10)
ForcePlayerStartLocation(Player(10), 10)
SetPlayerColor(Player(10), ConvertPlayerColor(10))
SetPlayerRacePreference(Player(10), RACE_PREF_HUMAN)
SetPlayerRaceSelectable(Player(10), false)
SetPlayerController(Player(10), MAP_CONTROL_USER)
SetPlayerStartLocation(Player(11), 11)
ForcePlayerStartLocation(Player(11), 11)
SetPlayerColor(Player(11), ConvertPlayerColor(11))
SetPlayerRacePreference(Player(11), RACE_PREF_HUMAN)
SetPlayerRaceSelectable(Player(11), false)
SetPlayerController(Player(11), MAP_CONTROL_USER)
SetPlayerStartLocation(Player(12), 12)
ForcePlayerStartLocation(Player(12), 12)
SetPlayerColor(Player(12), ConvertPlayerColor(12))
SetPlayerRacePreference(Player(12), RACE_PREF_HUMAN)
SetPlayerRaceSelectable(Player(12), false)
SetPlayerController(Player(12), MAP_CONTROL_USER)
SetPlayerStartLocation(Player(13), 13)
SetPlayerColor(Player(13), ConvertPlayerColor(13))
SetPlayerRacePreference(Player(13), RACE_PREF_UNDEAD)
SetPlayerRaceSelectable(Player(13), false)
SetPlayerController(Player(13), MAP_CONTROL_COMPUTER)
end

function InitCustomTeams()
SetPlayerTeam(Player(0), 0)
SetPlayerState(Player(0), PLAYER_STATE_ALLIED_VICTORY, 1)
SetPlayerTeam(Player(1), 0)
SetPlayerState(Player(1), PLAYER_STATE_ALLIED_VICTORY, 1)
SetPlayerTeam(Player(2), 0)
SetPlayerState(Player(2), PLAYER_STATE_ALLIED_VICTORY, 1)
SetPlayerTeam(Player(3), 0)
SetPlayerState(Player(3), PLAYER_STATE_ALLIED_VICTORY, 1)
SetPlayerTeam(Player(4), 0)
SetPlayerState(Player(4), PLAYER_STATE_ALLIED_VICTORY, 1)
SetPlayerTeam(Player(5), 0)
SetPlayerState(Player(5), PLAYER_STATE_ALLIED_VICTORY, 1)
SetPlayerTeam(Player(6), 0)
SetPlayerState(Player(6), PLAYER_STATE_ALLIED_VICTORY, 1)
SetPlayerTeam(Player(7), 0)
SetPlayerState(Player(7), PLAYER_STATE_ALLIED_VICTORY, 1)
SetPlayerTeam(Player(8), 0)
SetPlayerState(Player(8), PLAYER_STATE_ALLIED_VICTORY, 1)
SetPlayerTeam(Player(9), 0)
SetPlayerState(Player(9), PLAYER_STATE_ALLIED_VICTORY, 1)
SetPlayerTeam(Player(10), 0)
SetPlayerState(Player(10), PLAYER_STATE_ALLIED_VICTORY, 1)
SetPlayerTeam(Player(11), 0)
SetPlayerState(Player(11), PLAYER_STATE_ALLIED_VICTORY, 1)
SetPlayerTeam(Player(12), 0)
SetPlayerState(Player(12), PLAYER_STATE_ALLIED_VICTORY, 1)
SetPlayerAllianceStateAllyBJ(Player(0), Player(1), true)
SetPlayerAllianceStateAllyBJ(Player(0), Player(2), true)
SetPlayerAllianceStateAllyBJ(Player(0), Player(3), true)
SetPlayerAllianceStateAllyBJ(Player(0), Player(4), true)
SetPlayerAllianceStateAllyBJ(Player(0), Player(5), true)
SetPlayerAllianceStateAllyBJ(Player(0), Player(6), true)
SetPlayerAllianceStateAllyBJ(Player(0), Player(7), true)
SetPlayerAllianceStateAllyBJ(Player(0), Player(8), true)
SetPlayerAllianceStateAllyBJ(Player(0), Player(9), true)
SetPlayerAllianceStateAllyBJ(Player(0), Player(10), true)
SetPlayerAllianceStateAllyBJ(Player(0), Player(11), true)
SetPlayerAllianceStateAllyBJ(Player(0), Player(12), true)
SetPlayerAllianceStateAllyBJ(Player(1), Player(0), true)
SetPlayerAllianceStateAllyBJ(Player(1), Player(2), true)
SetPlayerAllianceStateAllyBJ(Player(1), Player(3), true)
SetPlayerAllianceStateAllyBJ(Player(1), Player(4), true)
SetPlayerAllianceStateAllyBJ(Player(1), Player(5), true)
SetPlayerAllianceStateAllyBJ(Player(1), Player(6), true)
SetPlayerAllianceStateAllyBJ(Player(1), Player(7), true)
SetPlayerAllianceStateAllyBJ(Player(1), Player(8), true)
SetPlayerAllianceStateAllyBJ(Player(1), Player(9), true)
SetPlayerAllianceStateAllyBJ(Player(1), Player(10), true)
SetPlayerAllianceStateAllyBJ(Player(1), Player(11), true)
SetPlayerAllianceStateAllyBJ(Player(1), Player(12), true)
SetPlayerAllianceStateAllyBJ(Player(2), Player(0), true)
SetPlayerAllianceStateAllyBJ(Player(2), Player(1), true)
SetPlayerAllianceStateAllyBJ(Player(2), Player(3), true)
SetPlayerAllianceStateAllyBJ(Player(2), Player(4), true)
SetPlayerAllianceStateAllyBJ(Player(2), Player(5), true)
SetPlayerAllianceStateAllyBJ(Player(2), Player(6), true)
SetPlayerAllianceStateAllyBJ(Player(2), Player(7), true)
SetPlayerAllianceStateAllyBJ(Player(2), Player(8), true)
SetPlayerAllianceStateAllyBJ(Player(2), Player(9), true)
SetPlayerAllianceStateAllyBJ(Player(2), Player(10), true)
SetPlayerAllianceStateAllyBJ(Player(2), Player(11), true)
SetPlayerAllianceStateAllyBJ(Player(2), Player(12), true)
SetPlayerAllianceStateAllyBJ(Player(3), Player(0), true)
SetPlayerAllianceStateAllyBJ(Player(3), Player(1), true)
SetPlayerAllianceStateAllyBJ(Player(3), Player(2), true)
SetPlayerAllianceStateAllyBJ(Player(3), Player(4), true)
SetPlayerAllianceStateAllyBJ(Player(3), Player(5), true)
SetPlayerAllianceStateAllyBJ(Player(3), Player(6), true)
SetPlayerAllianceStateAllyBJ(Player(3), Player(7), true)
SetPlayerAllianceStateAllyBJ(Player(3), Player(8), true)
SetPlayerAllianceStateAllyBJ(Player(3), Player(9), true)
SetPlayerAllianceStateAllyBJ(Player(3), Player(10), true)
SetPlayerAllianceStateAllyBJ(Player(3), Player(11), true)
SetPlayerAllianceStateAllyBJ(Player(3), Player(12), true)
SetPlayerAllianceStateAllyBJ(Player(4), Player(0), true)
SetPlayerAllianceStateAllyBJ(Player(4), Player(1), true)
SetPlayerAllianceStateAllyBJ(Player(4), Player(2), true)
SetPlayerAllianceStateAllyBJ(Player(4), Player(3), true)
SetPlayerAllianceStateAllyBJ(Player(4), Player(5), true)
SetPlayerAllianceStateAllyBJ(Player(4), Player(6), true)
SetPlayerAllianceStateAllyBJ(Player(4), Player(7), true)
SetPlayerAllianceStateAllyBJ(Player(4), Player(8), true)
SetPlayerAllianceStateAllyBJ(Player(4), Player(9), true)
SetPlayerAllianceStateAllyBJ(Player(4), Player(10), true)
SetPlayerAllianceStateAllyBJ(Player(4), Player(11), true)
SetPlayerAllianceStateAllyBJ(Player(4), Player(12), true)
SetPlayerAllianceStateAllyBJ(Player(5), Player(0), true)
SetPlayerAllianceStateAllyBJ(Player(5), Player(1), true)
SetPlayerAllianceStateAllyBJ(Player(5), Player(2), true)
SetPlayerAllianceStateAllyBJ(Player(5), Player(3), true)
SetPlayerAllianceStateAllyBJ(Player(5), Player(4), true)
SetPlayerAllianceStateAllyBJ(Player(5), Player(6), true)
SetPlayerAllianceStateAllyBJ(Player(5), Player(7), true)
SetPlayerAllianceStateAllyBJ(Player(5), Player(8), true)
SetPlayerAllianceStateAllyBJ(Player(5), Player(9), true)
SetPlayerAllianceStateAllyBJ(Player(5), Player(10), true)
SetPlayerAllianceStateAllyBJ(Player(5), Player(11), true)
SetPlayerAllianceStateAllyBJ(Player(5), Player(12), true)
SetPlayerAllianceStateAllyBJ(Player(6), Player(0), true)
SetPlayerAllianceStateAllyBJ(Player(6), Player(1), true)
SetPlayerAllianceStateAllyBJ(Player(6), Player(2), true)
SetPlayerAllianceStateAllyBJ(Player(6), Player(3), true)
SetPlayerAllianceStateAllyBJ(Player(6), Player(4), true)
SetPlayerAllianceStateAllyBJ(Player(6), Player(5), true)
SetPlayerAllianceStateAllyBJ(Player(6), Player(7), true)
SetPlayerAllianceStateAllyBJ(Player(6), Player(8), true)
SetPlayerAllianceStateAllyBJ(Player(6), Player(9), true)
SetPlayerAllianceStateAllyBJ(Player(6), Player(10), true)
SetPlayerAllianceStateAllyBJ(Player(6), Player(11), true)
SetPlayerAllianceStateAllyBJ(Player(6), Player(12), true)
SetPlayerAllianceStateAllyBJ(Player(7), Player(0), true)
SetPlayerAllianceStateAllyBJ(Player(7), Player(1), true)
SetPlayerAllianceStateAllyBJ(Player(7), Player(2), true)
SetPlayerAllianceStateAllyBJ(Player(7), Player(3), true)
SetPlayerAllianceStateAllyBJ(Player(7), Player(4), true)
SetPlayerAllianceStateAllyBJ(Player(7), Player(5), true)
SetPlayerAllianceStateAllyBJ(Player(7), Player(6), true)
SetPlayerAllianceStateAllyBJ(Player(7), Player(8), true)
SetPlayerAllianceStateAllyBJ(Player(7), Player(9), true)
SetPlayerAllianceStateAllyBJ(Player(7), Player(10), true)
SetPlayerAllianceStateAllyBJ(Player(7), Player(11), true)
SetPlayerAllianceStateAllyBJ(Player(7), Player(12), true)
SetPlayerAllianceStateAllyBJ(Player(8), Player(0), true)
SetPlayerAllianceStateAllyBJ(Player(8), Player(1), true)
SetPlayerAllianceStateAllyBJ(Player(8), Player(2), true)
SetPlayerAllianceStateAllyBJ(Player(8), Player(3), true)
SetPlayerAllianceStateAllyBJ(Player(8), Player(4), true)
SetPlayerAllianceStateAllyBJ(Player(8), Player(5), true)
SetPlayerAllianceStateAllyBJ(Player(8), Player(6), true)
SetPlayerAllianceStateAllyBJ(Player(8), Player(7), true)
SetPlayerAllianceStateAllyBJ(Player(8), Player(9), true)
SetPlayerAllianceStateAllyBJ(Player(8), Player(10), true)
SetPlayerAllianceStateAllyBJ(Player(8), Player(11), true)
SetPlayerAllianceStateAllyBJ(Player(8), Player(12), true)
SetPlayerAllianceStateAllyBJ(Player(9), Player(0), true)
SetPlayerAllianceStateAllyBJ(Player(9), Player(1), true)
SetPlayerAllianceStateAllyBJ(Player(9), Player(2), true)
SetPlayerAllianceStateAllyBJ(Player(9), Player(3), true)
SetPlayerAllianceStateAllyBJ(Player(9), Player(4), true)
SetPlayerAllianceStateAllyBJ(Player(9), Player(5), true)
SetPlayerAllianceStateAllyBJ(Player(9), Player(6), true)
SetPlayerAllianceStateAllyBJ(Player(9), Player(7), true)
SetPlayerAllianceStateAllyBJ(Player(9), Player(8), true)
SetPlayerAllianceStateAllyBJ(Player(9), Player(10), true)
SetPlayerAllianceStateAllyBJ(Player(9), Player(11), true)
SetPlayerAllianceStateAllyBJ(Player(9), Player(12), true)
SetPlayerAllianceStateAllyBJ(Player(10), Player(0), true)
SetPlayerAllianceStateAllyBJ(Player(10), Player(1), true)
SetPlayerAllianceStateAllyBJ(Player(10), Player(2), true)
SetPlayerAllianceStateAllyBJ(Player(10), Player(3), true)
SetPlayerAllianceStateAllyBJ(Player(10), Player(4), true)
SetPlayerAllianceStateAllyBJ(Player(10), Player(5), true)
SetPlayerAllianceStateAllyBJ(Player(10), Player(6), true)
SetPlayerAllianceStateAllyBJ(Player(10), Player(7), true)
SetPlayerAllianceStateAllyBJ(Player(10), Player(8), true)
SetPlayerAllianceStateAllyBJ(Player(10), Player(9), true)
SetPlayerAllianceStateAllyBJ(Player(10), Player(11), true)
SetPlayerAllianceStateAllyBJ(Player(10), Player(12), true)
SetPlayerAllianceStateAllyBJ(Player(11), Player(0), true)
SetPlayerAllianceStateAllyBJ(Player(11), Player(1), true)
SetPlayerAllianceStateAllyBJ(Player(11), Player(2), true)
SetPlayerAllianceStateAllyBJ(Player(11), Player(3), true)
SetPlayerAllianceStateAllyBJ(Player(11), Player(4), true)
SetPlayerAllianceStateAllyBJ(Player(11), Player(5), true)
SetPlayerAllianceStateAllyBJ(Player(11), Player(6), true)
SetPlayerAllianceStateAllyBJ(Player(11), Player(7), true)
SetPlayerAllianceStateAllyBJ(Player(11), Player(8), true)
SetPlayerAllianceStateAllyBJ(Player(11), Player(9), true)
SetPlayerAllianceStateAllyBJ(Player(11), Player(10), true)
SetPlayerAllianceStateAllyBJ(Player(11), Player(12), true)
SetPlayerAllianceStateAllyBJ(Player(12), Player(0), true)
SetPlayerAllianceStateAllyBJ(Player(12), Player(1), true)
SetPlayerAllianceStateAllyBJ(Player(12), Player(2), true)
SetPlayerAllianceStateAllyBJ(Player(12), Player(3), true)
SetPlayerAllianceStateAllyBJ(Player(12), Player(4), true)
SetPlayerAllianceStateAllyBJ(Player(12), Player(5), true)
SetPlayerAllianceStateAllyBJ(Player(12), Player(6), true)
SetPlayerAllianceStateAllyBJ(Player(12), Player(7), true)
SetPlayerAllianceStateAllyBJ(Player(12), Player(8), true)
SetPlayerAllianceStateAllyBJ(Player(12), Player(9), true)
SetPlayerAllianceStateAllyBJ(Player(12), Player(10), true)
SetPlayerAllianceStateAllyBJ(Player(12), Player(11), true)
SetPlayerAllianceStateVisionBJ(Player(0), Player(1), true)
SetPlayerAllianceStateVisionBJ(Player(0), Player(2), true)
SetPlayerAllianceStateVisionBJ(Player(0), Player(3), true)
SetPlayerAllianceStateVisionBJ(Player(0), Player(4), true)
SetPlayerAllianceStateVisionBJ(Player(0), Player(5), true)
SetPlayerAllianceStateVisionBJ(Player(0), Player(6), true)
SetPlayerAllianceStateVisionBJ(Player(0), Player(7), true)
SetPlayerAllianceStateVisionBJ(Player(0), Player(8), true)
SetPlayerAllianceStateVisionBJ(Player(0), Player(9), true)
SetPlayerAllianceStateVisionBJ(Player(0), Player(10), true)
SetPlayerAllianceStateVisionBJ(Player(0), Player(11), true)
SetPlayerAllianceStateVisionBJ(Player(0), Player(12), true)
SetPlayerAllianceStateVisionBJ(Player(1), Player(0), true)
SetPlayerAllianceStateVisionBJ(Player(1), Player(2), true)
SetPlayerAllianceStateVisionBJ(Player(1), Player(3), true)
SetPlayerAllianceStateVisionBJ(Player(1), Player(4), true)
SetPlayerAllianceStateVisionBJ(Player(1), Player(5), true)
SetPlayerAllianceStateVisionBJ(Player(1), Player(6), true)
SetPlayerAllianceStateVisionBJ(Player(1), Player(7), true)
SetPlayerAllianceStateVisionBJ(Player(1), Player(8), true)
SetPlayerAllianceStateVisionBJ(Player(1), Player(9), true)
SetPlayerAllianceStateVisionBJ(Player(1), Player(10), true)
SetPlayerAllianceStateVisionBJ(Player(1), Player(11), true)
SetPlayerAllianceStateVisionBJ(Player(1), Player(12), true)
SetPlayerAllianceStateVisionBJ(Player(2), Player(0), true)
SetPlayerAllianceStateVisionBJ(Player(2), Player(1), true)
SetPlayerAllianceStateVisionBJ(Player(2), Player(3), true)
SetPlayerAllianceStateVisionBJ(Player(2), Player(4), true)
SetPlayerAllianceStateVisionBJ(Player(2), Player(5), true)
SetPlayerAllianceStateVisionBJ(Player(2), Player(6), true)
SetPlayerAllianceStateVisionBJ(Player(2), Player(7), true)
SetPlayerAllianceStateVisionBJ(Player(2), Player(8), true)
SetPlayerAllianceStateVisionBJ(Player(2), Player(9), true)
SetPlayerAllianceStateVisionBJ(Player(2), Player(10), true)
SetPlayerAllianceStateVisionBJ(Player(2), Player(11), true)
SetPlayerAllianceStateVisionBJ(Player(2), Player(12), true)
SetPlayerAllianceStateVisionBJ(Player(3), Player(0), true)
SetPlayerAllianceStateVisionBJ(Player(3), Player(1), true)
SetPlayerAllianceStateVisionBJ(Player(3), Player(2), true)
SetPlayerAllianceStateVisionBJ(Player(3), Player(4), true)
SetPlayerAllianceStateVisionBJ(Player(3), Player(5), true)
SetPlayerAllianceStateVisionBJ(Player(3), Player(6), true)
SetPlayerAllianceStateVisionBJ(Player(3), Player(7), true)
SetPlayerAllianceStateVisionBJ(Player(3), Player(8), true)
SetPlayerAllianceStateVisionBJ(Player(3), Player(9), true)
SetPlayerAllianceStateVisionBJ(Player(3), Player(10), true)
SetPlayerAllianceStateVisionBJ(Player(3), Player(11), true)
SetPlayerAllianceStateVisionBJ(Player(3), Player(12), true)
SetPlayerAllianceStateVisionBJ(Player(4), Player(0), true)
SetPlayerAllianceStateVisionBJ(Player(4), Player(1), true)
SetPlayerAllianceStateVisionBJ(Player(4), Player(2), true)
SetPlayerAllianceStateVisionBJ(Player(4), Player(3), true)
SetPlayerAllianceStateVisionBJ(Player(4), Player(5), true)
SetPlayerAllianceStateVisionBJ(Player(4), Player(6), true)
SetPlayerAllianceStateVisionBJ(Player(4), Player(7), true)
SetPlayerAllianceStateVisionBJ(Player(4), Player(8), true)
SetPlayerAllianceStateVisionBJ(Player(4), Player(9), true)
SetPlayerAllianceStateVisionBJ(Player(4), Player(10), true)
SetPlayerAllianceStateVisionBJ(Player(4), Player(11), true)
SetPlayerAllianceStateVisionBJ(Player(4), Player(12), true)
SetPlayerAllianceStateVisionBJ(Player(5), Player(0), true)
SetPlayerAllianceStateVisionBJ(Player(5), Player(1), true)
SetPlayerAllianceStateVisionBJ(Player(5), Player(2), true)
SetPlayerAllianceStateVisionBJ(Player(5), Player(3), true)
SetPlayerAllianceStateVisionBJ(Player(5), Player(4), true)
SetPlayerAllianceStateVisionBJ(Player(5), Player(6), true)
SetPlayerAllianceStateVisionBJ(Player(5), Player(7), true)
SetPlayerAllianceStateVisionBJ(Player(5), Player(8), true)
SetPlayerAllianceStateVisionBJ(Player(5), Player(9), true)
SetPlayerAllianceStateVisionBJ(Player(5), Player(10), true)
SetPlayerAllianceStateVisionBJ(Player(5), Player(11), true)
SetPlayerAllianceStateVisionBJ(Player(5), Player(12), true)
SetPlayerAllianceStateVisionBJ(Player(6), Player(0), true)
SetPlayerAllianceStateVisionBJ(Player(6), Player(1), true)
SetPlayerAllianceStateVisionBJ(Player(6), Player(2), true)
SetPlayerAllianceStateVisionBJ(Player(6), Player(3), true)
SetPlayerAllianceStateVisionBJ(Player(6), Player(4), true)
SetPlayerAllianceStateVisionBJ(Player(6), Player(5), true)
SetPlayerAllianceStateVisionBJ(Player(6), Player(7), true)
SetPlayerAllianceStateVisionBJ(Player(6), Player(8), true)
SetPlayerAllianceStateVisionBJ(Player(6), Player(9), true)
SetPlayerAllianceStateVisionBJ(Player(6), Player(10), true)
SetPlayerAllianceStateVisionBJ(Player(6), Player(11), true)
SetPlayerAllianceStateVisionBJ(Player(6), Player(12), true)
SetPlayerAllianceStateVisionBJ(Player(7), Player(0), true)
SetPlayerAllianceStateVisionBJ(Player(7), Player(1), true)
SetPlayerAllianceStateVisionBJ(Player(7), Player(2), true)
SetPlayerAllianceStateVisionBJ(Player(7), Player(3), true)
SetPlayerAllianceStateVisionBJ(Player(7), Player(4), true)
SetPlayerAllianceStateVisionBJ(Player(7), Player(5), true)
SetPlayerAllianceStateVisionBJ(Player(7), Player(6), true)
SetPlayerAllianceStateVisionBJ(Player(7), Player(8), true)
SetPlayerAllianceStateVisionBJ(Player(7), Player(9), true)
SetPlayerAllianceStateVisionBJ(Player(7), Player(10), true)
SetPlayerAllianceStateVisionBJ(Player(7), Player(11), true)
SetPlayerAllianceStateVisionBJ(Player(7), Player(12), true)
SetPlayerAllianceStateVisionBJ(Player(8), Player(0), true)
SetPlayerAllianceStateVisionBJ(Player(8), Player(1), true)
SetPlayerAllianceStateVisionBJ(Player(8), Player(2), true)
SetPlayerAllianceStateVisionBJ(Player(8), Player(3), true)
SetPlayerAllianceStateVisionBJ(Player(8), Player(4), true)
SetPlayerAllianceStateVisionBJ(Player(8), Player(5), true)
SetPlayerAllianceStateVisionBJ(Player(8), Player(6), true)
SetPlayerAllianceStateVisionBJ(Player(8), Player(7), true)
SetPlayerAllianceStateVisionBJ(Player(8), Player(9), true)
SetPlayerAllianceStateVisionBJ(Player(8), Player(10), true)
SetPlayerAllianceStateVisionBJ(Player(8), Player(11), true)
SetPlayerAllianceStateVisionBJ(Player(8), Player(12), true)
SetPlayerAllianceStateVisionBJ(Player(9), Player(0), true)
SetPlayerAllianceStateVisionBJ(Player(9), Player(1), true)
SetPlayerAllianceStateVisionBJ(Player(9), Player(2), true)
SetPlayerAllianceStateVisionBJ(Player(9), Player(3), true)
SetPlayerAllianceStateVisionBJ(Player(9), Player(4), true)
SetPlayerAllianceStateVisionBJ(Player(9), Player(5), true)
SetPlayerAllianceStateVisionBJ(Player(9), Player(6), true)
SetPlayerAllianceStateVisionBJ(Player(9), Player(7), true)
SetPlayerAllianceStateVisionBJ(Player(9), Player(8), true)
SetPlayerAllianceStateVisionBJ(Player(9), Player(10), true)
SetPlayerAllianceStateVisionBJ(Player(9), Player(11), true)
SetPlayerAllianceStateVisionBJ(Player(9), Player(12), true)
SetPlayerAllianceStateVisionBJ(Player(10), Player(0), true)
SetPlayerAllianceStateVisionBJ(Player(10), Player(1), true)
SetPlayerAllianceStateVisionBJ(Player(10), Player(2), true)
SetPlayerAllianceStateVisionBJ(Player(10), Player(3), true)
SetPlayerAllianceStateVisionBJ(Player(10), Player(4), true)
SetPlayerAllianceStateVisionBJ(Player(10), Player(5), true)
SetPlayerAllianceStateVisionBJ(Player(10), Player(6), true)
SetPlayerAllianceStateVisionBJ(Player(10), Player(7), true)
SetPlayerAllianceStateVisionBJ(Player(10), Player(8), true)
SetPlayerAllianceStateVisionBJ(Player(10), Player(9), true)
SetPlayerAllianceStateVisionBJ(Player(10), Player(11), true)
SetPlayerAllianceStateVisionBJ(Player(10), Player(12), true)
SetPlayerAllianceStateVisionBJ(Player(11), Player(0), true)
SetPlayerAllianceStateVisionBJ(Player(11), Player(1), true)
SetPlayerAllianceStateVisionBJ(Player(11), Player(2), true)
SetPlayerAllianceStateVisionBJ(Player(11), Player(3), true)
SetPlayerAllianceStateVisionBJ(Player(11), Player(4), true)
SetPlayerAllianceStateVisionBJ(Player(11), Player(5), true)
SetPlayerAllianceStateVisionBJ(Player(11), Player(6), true)
SetPlayerAllianceStateVisionBJ(Player(11), Player(7), true)
SetPlayerAllianceStateVisionBJ(Player(11), Player(8), true)
SetPlayerAllianceStateVisionBJ(Player(11), Player(9), true)
SetPlayerAllianceStateVisionBJ(Player(11), Player(10), true)
SetPlayerAllianceStateVisionBJ(Player(11), Player(12), true)
SetPlayerAllianceStateVisionBJ(Player(12), Player(0), true)
SetPlayerAllianceStateVisionBJ(Player(12), Player(1), true)
SetPlayerAllianceStateVisionBJ(Player(12), Player(2), true)
SetPlayerAllianceStateVisionBJ(Player(12), Player(3), true)
SetPlayerAllianceStateVisionBJ(Player(12), Player(4), true)
SetPlayerAllianceStateVisionBJ(Player(12), Player(5), true)
SetPlayerAllianceStateVisionBJ(Player(12), Player(6), true)
SetPlayerAllianceStateVisionBJ(Player(12), Player(7), true)
SetPlayerAllianceStateVisionBJ(Player(12), Player(8), true)
SetPlayerAllianceStateVisionBJ(Player(12), Player(9), true)
SetPlayerAllianceStateVisionBJ(Player(12), Player(10), true)
SetPlayerAllianceStateVisionBJ(Player(12), Player(11), true)
SetPlayerTeam(Player(13), 1)
SetPlayerState(Player(13), PLAYER_STATE_ALLIED_VICTORY, 1)
end

function InitAllyPriorities()
SetStartLocPrioCount(0, 2)
SetStartLocPrio(0, 0, 1, MAP_LOC_PRIO_HIGH)
SetStartLocPrio(0, 1, 11, MAP_LOC_PRIO_HIGH)
SetStartLocPrioCount(1, 3)
SetStartLocPrio(1, 0, 0, MAP_LOC_PRIO_HIGH)
SetStartLocPrio(1, 1, 2, MAP_LOC_PRIO_HIGH)
SetStartLocPrio(1, 2, 4, MAP_LOC_PRIO_HIGH)
SetStartLocPrioCount(2, 2)
SetStartLocPrio(2, 0, 1, MAP_LOC_PRIO_HIGH)
SetStartLocPrio(2, 1, 12, MAP_LOC_PRIO_HIGH)
SetStartLocPrioCount(3, 3)
SetStartLocPrio(3, 0, 7, MAP_LOC_PRIO_LOW)
SetStartLocPrio(3, 1, 10, MAP_LOC_PRIO_HIGH)
SetStartLocPrio(3, 2, 12, MAP_LOC_PRIO_LOW)
SetStartLocPrioCount(4, 6)
SetStartLocPrio(4, 0, 0, MAP_LOC_PRIO_LOW)
SetStartLocPrio(4, 1, 1, MAP_LOC_PRIO_HIGH)
SetStartLocPrio(4, 2, 2, MAP_LOC_PRIO_LOW)
SetStartLocPrio(4, 3, 8, MAP_LOC_PRIO_LOW)
SetStartLocPrio(4, 4, 9, MAP_LOC_PRIO_HIGH)
SetStartLocPrio(4, 5, 10, MAP_LOC_PRIO_HIGH)
SetStartLocPrioCount(5, 3)
SetStartLocPrio(5, 0, 6, MAP_LOC_PRIO_LOW)
SetStartLocPrio(5, 1, 9, MAP_LOC_PRIO_HIGH)
SetStartLocPrio(5, 2, 11, MAP_LOC_PRIO_LOW)
SetStartLocPrioCount(6, 3)
SetStartLocPrio(6, 0, 5, MAP_LOC_PRIO_HIGH)
SetStartLocPrio(6, 1, 8, MAP_LOC_PRIO_LOW)
SetStartLocPrio(6, 2, 9, MAP_LOC_PRIO_HIGH)
SetStartLocPrioCount(7, 3)
SetStartLocPrio(7, 0, 3, MAP_LOC_PRIO_HIGH)
SetStartLocPrio(7, 1, 8, MAP_LOC_PRIO_LOW)
SetStartLocPrio(7, 2, 10, MAP_LOC_PRIO_HIGH)
SetStartLocPrioCount(8, 5)
SetStartLocPrio(8, 0, 4, MAP_LOC_PRIO_LOW)
SetStartLocPrio(8, 1, 6, MAP_LOC_PRIO_LOW)
SetStartLocPrio(8, 2, 7, MAP_LOC_PRIO_LOW)
SetStartLocPrio(8, 3, 9, MAP_LOC_PRIO_HIGH)
SetStartLocPrio(8, 4, 10, MAP_LOC_PRIO_HIGH)
SetStartLocPrioCount(9, 4)
SetStartLocPrio(9, 0, 4, MAP_LOC_PRIO_LOW)
SetStartLocPrio(9, 1, 5, MAP_LOC_PRIO_HIGH)
SetStartLocPrio(9, 2, 6, MAP_LOC_PRIO_HIGH)
SetStartLocPrio(9, 3, 8, MAP_LOC_PRIO_HIGH)
SetStartLocPrioCount(10, 4)
SetStartLocPrio(10, 0, 3, MAP_LOC_PRIO_HIGH)
SetStartLocPrio(10, 1, 4, MAP_LOC_PRIO_LOW)
SetStartLocPrio(10, 2, 7, MAP_LOC_PRIO_HIGH)
SetStartLocPrio(10, 3, 8, MAP_LOC_PRIO_HIGH)
SetStartLocPrioCount(11, 2)
SetStartLocPrio(11, 0, 0, MAP_LOC_PRIO_HIGH)
SetStartLocPrio(11, 1, 5, MAP_LOC_PRIO_HIGH)
SetStartLocPrioCount(12, 2)
SetStartLocPrio(12, 0, 2, MAP_LOC_PRIO_HIGH)
SetStartLocPrio(12, 1, 3, MAP_LOC_PRIO_HIGH)
end

function main()
SetCameraBounds(-5376.0 + GetCameraMargin(CAMERA_MARGIN_LEFT), -5632.0 + GetCameraMargin(CAMERA_MARGIN_BOTTOM), 5376.0 - GetCameraMargin(CAMERA_MARGIN_RIGHT), 5632.0 - GetCameraMargin(CAMERA_MARGIN_TOP), -5376.0 + GetCameraMargin(CAMERA_MARGIN_LEFT), 5632.0 - GetCameraMargin(CAMERA_MARGIN_TOP), 5376.0 - GetCameraMargin(CAMERA_MARGIN_RIGHT), -5632.0 + GetCameraMargin(CAMERA_MARGIN_BOTTOM))
SetDayNightModels("Environment\\DNC\\DNCLordaeron\\DNCLordaeronTerrain\\DNCLordaeronTerrain.mdl", "Environment\\DNC\\DNCLordaeron\\DNCLordaeronUnit\\DNCLordaeronUnit.mdl")
SetWaterBaseColor(128, 128, 255, 255)
NewSoundEnvironment("Default")
SetAmbientDaySound("IceCrownDay")
SetAmbientNightSound("IceCrownNight")
SetMapMusic("Music", true, 0)
InitUpgrades()
InitTechTree()
InitBlizzard()
InitGlobals()
InitCustomTriggers()
end

function config()
SetMapName("TRIGSTR_6276")
SetMapDescription("TRIGSTR_9414")
SetPlayers(14)
SetTeams(14)
SetGamePlacement(MAP_PLACEMENT_TEAMS_TOGETHER)
DefineStartLocation(0, -2432.0, 4736.0)
DefineStartLocation(1, 0.0, 4096.0)
DefineStartLocation(2, 2432.0, 4736.0)
DefineStartLocation(3, 4352.0, -512.0)
DefineStartLocation(4, 0.0, 1024.0)
DefineStartLocation(5, -4352.0, -512.0)
DefineStartLocation(6, -3840.0, -3456.0)
DefineStartLocation(7, 3840.0, -3456.0)
DefineStartLocation(8, 0.0, -3072.0)
DefineStartLocation(9, -2176.0, -1280.0)
DefineStartLocation(10, 2176.0, -1280.0)
DefineStartLocation(11, -4352.0, 2560.0)
DefineStartLocation(12, 4352.0, 2560.0)
DefineStartLocation(13, 0.0, -4736.0)
InitCustomPlayerSlots()
InitCustomTeams()
InitAllyPriorities()
end

