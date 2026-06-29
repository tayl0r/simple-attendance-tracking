# Attendance Tracker

A simple web app for tracking player attendance at youth soccer events — games and training sessions.

## Language

**Event**:
A scheduled team activity — either a game or a training session. The top-level unit for attendance tracking.
_Avoid_: Game (as the umbrella term), match, session

**Game**:
An Event where two teams compete. Has a home team, away team, and location.
_Avoid_: Match

**Training**:
An Event where one team practices. Has no opponent — just a team, location, and time.
_Avoid_: Practice, session

**Schedule**:
A named collection of Events for a given season or period, covering one or more teams.
_Avoid_: Season, calendar

**Roster**:
A named list of Players. Can be attached to one or more Schedules.
_Avoid_: Squad, team list

**Player**:
A person on a Roster, identified by first name and last name.
_Avoid_: Athlete, kid, participant

**Attendance**:
A Player's response for a specific Event: yes, no, or maybe — optionally with a note.
_Avoid_: RSVP, response
