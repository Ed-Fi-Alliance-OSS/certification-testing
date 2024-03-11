------------------
---Calendar---
select	C.CalendarCode
	,C.SchoolId
	,C.SchoolYear
	,DCT.CodeValue AS [CalendarTypeDescriptor]
	,DGL.CodeValue AS [GradeLevelDescriptor]
FROM edfi.Calendar C
JOIN edfi.CalendarTypeDescriptor CTD on CTD.CalendarTypeDescriptorId = C.CalendarTypeDescriptorId
JOIN edfi.Descriptor DCT on DCT.DescriptorId = CTD.CalendarTypeDescriptorId 
JOIN edfi.CalendarGradeLevel CGL on CGL.CalendarCode = C.CalendarCode
	AND CGL.SchoolId = C.SchoolId
	AND CGL.SchoolYear = C.SchoolYear
JOIN edfi.Descriptor DGL on DGL.DescriptorId = CGL.GradeLevelDescriptorId
WHERE C.SchoolId IN (255901107,255901001)

------------------
---CalendarDate---
SELECT CD.Date
     , CD.CalendarCode
	 , CD.SchoolId
	 , CD.SchoolYear
     , DCE.CodeValue AS [CalendarEventDescriptor]
FROM edfi.CalendarDate CD
JOIN edfi.CalendarDateCalendarEvent CDCE ON CDCE.SchoolId = CD.SchoolId 
	AND CDCE.Date = CD.Date
JOIN edfi.CalendarEventDescriptor CED ON CED.CalendarEventDescriptorId = CDCE.CalendarEventDescriptorId
JOIN edfi.Descriptor DCE ON DCE.DescriptorId = CED.CalendarEventDescriptorId
WHERE CD.SchoolId IN (255901107,255901001)

-------------------
---GradingPeriod---
SELECT GP.SchoolId
     , GP.SchoolYear
	 , GP.BeginDate
	 , DGP.CodeValue AS [GradingPeriodDescriptor]
	 , GP.EndDate
	 , GP.TotalInstructionalDays
	 , GP.PeriodSequence
FROM edfi.GradingPeriod GP   
JOIN edfi.GradingPeriodDescriptor GPD ON GP.GradingPeriodDescriptorId = GPD.GradingPeriodDescriptorId
JOIN edfi.Descriptor DGP ON DGP.DescriptorId = GPD.GradingPeriodDescriptorId
WHERE GP.SchoolId IN (255901107,255901001)
	AND DGP.CodeValue IN ('First Six Weeks','Second Six Weeks')

-------------
---Session---
SELECT S.SchoolId
	 , SYT.SchoolYearDescription
	 , DT.CodeValue AS [TermDescriptor]
	 , S.SessionName
	 , S.BeginDate
	 , S.EndDate
	 , S.TotalInstructionalDays
	 , GP.SchoolId AS [GradingPeriodSchoolId]
	 , DGP.CodeValue AS [GradingPeriodDescriptor]
	 , GP.PeriodSequence AS [GradingPeriodPeriodSequence]
	 , GP.SchoolYear AS [GradingPeriodSchoolYear]
FROM edfi.Session AS S
JOIN edfi.SchoolYearType SYT ON SYT.SchoolYear = S.SchoolYear
JOIN edfi.TermDescriptor TD ON TD.TermDescriptorId = S.TermDescriptorId
JOIN edfi.Descriptor DT ON DT.DescriptorId = TD.TermDescriptorId
JOIN edfi.SessionGradingPeriod SGP ON SGP.SchoolId = S.SchoolId
	AND SGP.SchoolYear = S.SchoolYear
JOIN edfi.GradingPeriod GP ON GP.GradingPeriodDescriptorId = SGP.GradingPeriodDescriptorId
	AND GP.SchoolId = SGP.SchoolId
	AND GP.PeriodSequence = SGP.PeriodSequence
	AND GP.SchoolYear = SGP.SchoolYear
JOIN edfi.GradingPeriodDescriptor GPD ON GPD.GradingPeriodDescriptorId = GP.GradingPeriodDescriptorId
JOIN edfi.Descriptor DGP ON DGP.DescriptorId = GPD.GradingPeriodDescriptorId
WHERE S.SchoolId IN (255901107,255901001)
	AND DT.CodeValue = 'Fall Semester'