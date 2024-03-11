----------------------------------
---StudentSchoolAttendanceEvent---
SELECT SSAE.SchoolId
     , Se.SchoolId AS [SessionSchoolId]
	 , SYT.SchoolYearDescription
	 , Se.SessionName
	 , S.StudentUniqueID
	 , DAEC.CodeValue AS [AttendanceEventCategoryDescriptor]
	 , SSAE.EventDate
FROM edfi.StudentSchoolAttendanceEvent SSAE
JOIN edfi.Session Se ON Se.SchoolId = SSAE.SchoolId
	AND Se.SchoolYear = SSAE.SchoolYear
	AND Se.SessionName = SSAE.SessionName
JOIN edfi.SchoolYearType SYT ON SYT.SchoolYear = Se.SchoolYear
JOIN edfi.Student S ON S.StudentUSI = SSAE.StudentUSI
JOIN edfi.AttendanceEventCategoryDescriptor AECD ON AECD.AttendanceEventCategoryDescriptorId = SSAE.AttendanceEventCategoryDescriptorId
JOIN edfi.Descriptor DAEC ON DAEC.DescriptorId = AECD.AttendanceEventCategoryDescriptorId
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))


-----------------------------------
---StudentSectionAttendanceEvent---
SELECT SSAE.LocalCourseCode
	 , SSAE.SchoolId
	 , SYT.SchoolYearDescription
	 , SSAE.SectionIdentifier
	 , SSAE.SessionName
	 , S.StudentUniqueId
	 , DAEC.CodeValue AS [AttendanceEventCategoryDescriptor]
	 , SSAE.EventDate
FROM edfi.StudentSectionAttendanceEvent SSAE
JOIN edfi.SchoolYearType SYT ON SYT.SchoolYear = SSAE.SchoolYear
JOIN edfi.Student S ON S.StudentUSI = SSAE.StudentUSI
JOIN edfi.AttendanceEventCategoryDescriptor AECD ON AECD.AttendanceEventCategoryDescriptorId = SSAE.AttendanceEventCategoryDescriptorId
JOIN edfi.Descriptor DAEC ON DAEC.DescriptorId = AECD.AttendanceEventCategoryDescriptorId
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))