-----------
---Grade---
SELECT DGT.CodeValue AS [GradeTypeDescriptor]
	 , G.LetterGradeEarned
	 , G.NumericGradeEarned
	 , GP.SchoolId [GradingPeriodSchoolId]
	 , DGP.CodeValue AS [GradingPeriodDescriptor]
	 , GP.PeriodSequence
	 , GP.SchoolYear AS [GradingPeriodSchoolYear]
	 , SSA.BeginDate
	 , SSA.LocalCourseCode
	 , SSA.SchoolId AS [StudentSectionAssociationSchoolId]
	 , SYT.SchoolYearDescription AS [StudentSectionAssociationSchoolYear]
	 , S.StudentUniqueId
	 , SSA.SessionName
	 , SSA.SectionIdentifier
FROM edfi.Grade G
JOIN edfi.GradeTypeDescriptor GTD ON GTD.GradeTypeDescriptorId = G.GradeTypeDescriptorId
JOIN edfi.Descriptor DGT ON DGT.DescriptorId = GTD.GradeTypeDescriptorId
JOIN edfi.GradingPeriod GP ON GP.GradingPeriodDescriptorId = G.GradingPeriodDescriptorId
	AND GP.SchoolId = G.SchoolId
JOIN edfi.GradingPeriodDescriptor GPD ON GPD.GradingPeriodDescriptorId = GP.GradingPeriodDescriptorId
JOIN edfi.Descriptor DGP ON DGP.DescriptorId = GPD.GradingPeriodDescriptorId
JOIN edfi.StudentSectionAssociation SSA ON SSA.StudentUSI = G.StudentUSI
	AND SSA.SchoolId = G.SchoolId
	AND SSA.LocalCourseCode = G.LocalCourseCode
	AND SSA.SectionIdentifier = G.SectionIdentifier
	AND SSA.SchoolYear = G.SchoolYear
JOIN edfi.SchoolYearType SYT ON SYT.SchoolYear = SSA.SchoolYear
JOIN edfi.Student S ON S.StudentUSI = SSA.StudentUSI
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))


