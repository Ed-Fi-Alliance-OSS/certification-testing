--------------------
---CourseOffering---
SELECT C.CourseCode
     , C.EducationOrganizationId
     , CO.SchoolId
	 , S.SessionName 
	 , S.SchoolId AS [SessionSchoolId]
     , SYT.SchoolYearDescription AS [SessionSchoolYear]
     --, DT.CodeValue AS [TermDescriptor]
     , CO.LocalCourseTitle
     , CO.LocalCourseCode
FROM edfi.CourseOffering CO
JOIN edfi.Course C ON CO.CourseCode = C.CourseCode
    AND CO.EducationOrganizationId = C.EducationOrganizationId
JOIN edfi.Session S ON S.SchoolId = CO.SchoolId
    AND S.SchoolYear = CO.SchoolYear
    AND S.SessionName = CO.SessionName
JOIN edfi.SchoolYearType SYT ON SYT.SchoolYear = S.SchoolYear
JOIN edfi.TermDescriptor  TD ON S.TermDescriptorId = TD.TermDescriptorId
JOIN edfi.Descriptor DT ON DT.DescriptorId = TD.TermDescriptorId
WHERE CO.SchoolId IN (255901107,255901001)
	AND DT.CodeValue = 'Fall Semester'


-------------
---Section---
SELECT SCP.ClassPeriodName
	 , SCP.SchoolId AS [ClassPeriodSchoolId]
	 , s.SessionName
	 , CO.LocalCourseCode
	 , SYT.SchoolYearDescription AS [CourseOfferingSchoolId]
	 , S.SchoolYear
	 , L.ClassroomIdentificationCode
	 , L.SchoolId AS [LocationSchoolId]
	 , S.SchoolId
	 , S.SequenceOfCourse
	 , S.SectionIdentifier
	 , S.AvailableCredits
	 , DEE.CodeValue AS [EducationalEvnironmentDescriptor]
FROM edfi.Section S
JOIN edfi.SectionClassPeriod SCP ON SCP.SchoolId = S.SchoolId
		AND SCP.LocalCourseCode = S.LocalCourseCode
		AND SCP.SectionIdentifier = S.SectionIdentifier
		AND SCP.SessionName = S.SessionName
		AND SCP.SchoolYear = S.SchoolYear
JOIN edfi.CourseOffering CO ON CO.LocalCourseCode = S.LocalCourseCode
	AND CO.SchoolId = S.SchoolId
	AND CO.SchoolYear = S.SchoolYear
	AND CO.SessionName = S.SessionName
JOIN edfi.SchoolYearType SYT ON SYT.SchoolYear = CO.SchoolYear
JOIN edfi.Location L ON L.ClassroomIdentificationCode = S.LocationClassroomIdentificationCode
	AND L.SchoolId = S.SchoolId
JOIN edfi.Descriptor DEE on S.EducationalEnvironmentDescriptorId = DEE.DescriptorId 
		Join Edfi.EducationalEnvironmentDescriptor EED on DEE.DescriptorId = EED.EducationalEnvironmentDescriptorId 
WHERE S.SchoolId IN (255901107,255901001)
AND s.SessionName like ('%Fall Semester')

-------------------
---Bell Schedule---
SELECT BS.BellScheduleName
     , BS.SchoolId
	 , BSCP.ClassPeriodName
	 , BS.AlternateDayName
FROM edfi.BellSchedule BS
JOIN edfi.BellScheduleClassPeriod BSCP ON BSCP.BellScheduleName = BS.BellScheduleName
     AND BSCP.SchoolId = BS.SchoolId
WHERE BS.SchoolId = 255901107