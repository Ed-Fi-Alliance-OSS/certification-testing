----------------------
---CourseTranscript---
SELECT CT.CourseEducationOrganizationId
	 , CT.CourseCode
	 , SAR.EducationOrganizationId AS [StudentAcademicRecordEducationOrganizationId]
	 , SYT.SchoolYearDescription
	 , S.StudentUniqueId
	 , DT.CodeValue AS [TermDescriptor]
	 , DCAR.CodeValue AS [CourseAttemptResultDescriptor]
	 , CT.AttemptedCredits
	 , CT.EarnedCredits
	 , CT.FinalLetterGradeEarned
FROM edfi.CourseTranscript CT
JOIN edfi.StudentAcademicRecord SAR ON SAR.StudentUSI = CT.StudentUSI
	AND SAR.EducationOrganizationId = CT.EducationOrganizationId
	AND SAR.SchoolYear = CT.SchoolYear
	AND SAR.TermDescriptorId = CT.TermDescriptorId
JOIN edfi.SchoolYearType SYT ON SYT.SchoolYear = SAR.SchoolYear
JOIN edfi.Student S ON S.StudentUSI = SAR.StudentUSI
JOIN edfi.TermDescriptor TD ON TD.TermDescriptorId = SAR.TermDescriptorId
JOIN edfi.Descriptor DT ON DT.DescriptorId = TD.TermDescriptorId
JOIN edfi.CourseAttemptResultDescriptor CARD ON CARD.CourseAttemptResultDescriptorId = CT.CourseAttemptResultDescriptorId
JOIN edfi.Descriptor DCAR ON DCAR.DescriptorId = CARD.CourseAttemptResultDescriptorId
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))

---------------------------
---StudentAcademicRecord---
SELECT SAR.EducationOrganizationId
	 , SYT.SchoolYearDescription
	 , S.StudentUniqueId
	 , DT.CodeValue AS [TermDescriptor]
	 , SAR.CumulativeAttemptedCredits
	 , SAR.SessionAttemptedCredits
	 , SAR.CumulativeEarnedCredits
	 , SAR.SessionAttemptedCredits
	 , SAR.SessionEarnedCredits
FROM edfi.StudentAcademicRecord SAR
JOIN edfi.SchoolYearType SYT ON SYT.SchoolYear = SAR.SchoolYear
JOIN edfi.Student S ON S.StudentUSI = SAR.StudentUSI
JOIN edfi.TermDescriptor TD ON TD.TermDescriptorId = SAR.TermDescriptorId
JOIN edfi.Descriptor DT ON DT.DescriptorId = TD.TermDescriptorId
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))