-------------------------------
---StudentProgramAssociation---
SELECT SPA.BeginDate
	 , SPA.EducationOrganizationId
	 , SPA.ProgramEducationOrganizationId
	 , SPA.ProgramName
	 , DPT.CodeValue AS [ProgramTypeDescriptor]
	 , S.StudentUniqueId
	 , SPA.EndDate
FROM edfi.GeneralStudentProgramAssociation SPA
JOIN edfi.Program P ON P.ProgramName = SPA.ProgramName
	AND P.ProgramTypeDescriptorId = SPA.ProgramTypeDescriptorId
	AND P.EducationOrganizationId = SPA.ProgramEducationOrganizationId
JOIN edfi.ProgramTypeDescriptor PTD ON PTD.ProgramTypeDescriptorId = P.ProgramTypeDescriptorId
JOIN edfi.Descriptor DPT ON DPT.DescriptorId = PTD.ProgramTypeDescriptorId
JOIN edfi.Student S ON S.StudentUSI = SPA.StudentUSI
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))
	AND DPT.CodeValue IN ('Gifted and Talented','Career and Technical Education')


-----------------------------------------------
---StudentSpecialEducationProgramAssociation---
SELECT SSEPA.BeginDate
	 , SSEPA.EducationOrganizationId
	 , SSEPA.ProgramName
	 , DPT.CodeValue AS [ProgramTypeDescriptor]
	 , SSEPA.ProgramEducationOrganizationId
	 , DSES.CodeValue AS [SpecialEducationSettingDescriptor]
	 , S.StudentUniqueId
	 , SSEPA.IdeaEligibility
FROM edfi.StudentSpecialEducationProgramAssociation SSEPA
JOIN edfi.GeneralStudentProgramAssociation SPA ON SPA.ProgramEducationOrganizationId = SSEPA.ProgramEducationOrganizationId
	AND SPA.StudentUSI = SSEPA.StudentUSI
	AND SPA.EducationOrganizationId = SSEPA.EducationOrganizationId
	AND SPA.ProgramTypeDescriptorId = SSEPA.ProgramTypeDescriptorId
	AND SPA.ProgramName = SSEPA.ProgramName
	AND SPA.BeginDate = SSEPA.BeginDate
JOIN edfi.Program P ON P.ProgramName = SPA.ProgramName
	AND P.ProgramTypeDescriptorId = SPA.ProgramTypeDescriptorId
	AND P.EducationOrganizationId = SPA.ProgramEducationOrganizationId
JOIN edfi.ProgramTypeDescriptor PTD ON PTD.ProgramTypeDescriptorId = P.ProgramTypeDescriptorId
JOIN edfi.Descriptor DPT ON DPT.DescriptorId = PTD.ProgramTypeDescriptorId 
LEFT JOIN edfi.SpecialEducationSettingDescriptor SESD 
	ON SESD.SpecialEducationSettingDescriptorId = SSEPA.SpecialEducationSettingDescriptorId
LEFT JOIN edfi.Descriptor DSES ON DSES.DescriptorId = SESD.SpecialEducationSettingDescriptorId
JOIN edfi.Student S ON S.StudentUSI = SPA.StudentUSI
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))


-----------------------------------------------
---StudentTitleIPartAProgramAssociation---
SELECT STIPA.BeginDate
	 , STIPA.EducationOrganizationId
	 , STIPA.ProgramName
	 , DPT.CodeValue AS [ProgramTypeDescriptor]
	 , STIPA.ProgramEducationOrganizationId
	 , S.StudentUniqueId
	 , DTIPA.CodeValue AS [TitleIPartAParticipantDescriptor]
FROM edfi.StudentTitleIPartAProgramAssociation STIPA
JOIN edfi.GeneralStudentProgramAssociation SPA ON SPA.ProgramEducationOrganizationId = STIPA.ProgramEducationOrganizationId
	AND SPA.StudentUSI = STIPA.StudentUSI
	AND SPA.EducationOrganizationId = STIPA.EducationOrganizationId
	AND SPA.ProgramTypeDescriptorId = STIPA.ProgramTypeDescriptorId
	AND SPA.ProgramName = STIPA.ProgramName
	AND SPA.BeginDate = STIPA.BeginDate
JOIN edfi.Program P ON P.ProgramName = SPA.ProgramName
	AND P.ProgramTypeDescriptorId = SPA.ProgramTypeDescriptorId
	AND P.EducationOrganizationId = SPA.ProgramEducationOrganizationId
JOIN edfi.ProgramTypeDescriptor PTD ON PTD.ProgramTypeDescriptorId = P.ProgramTypeDescriptorId
JOIN edfi.Descriptor DPT ON DPT.DescriptorId = PTD.ProgramTypeDescriptorId 
JOIN edfi.Student S ON S.StudentUSI = SPA.StudentUSI
JOIN edfi.TitleIPartAParticipantDescriptor TIPA ON TIPA.TitleIPartAParticipantDescriptorId = STIPA.TitleIPartAParticipantDescriptorId
JOIN edfi.Descriptor DTIPA ON DTIPA.DescriptorId = TIPA.TitleIPartAParticipantDescriptorId 
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))


----------------------------------
---StudentCTEProgramAssociation---
SELECT SCPA.BeginDate
	 , SCPA.EducationOrganizationId
	 , SCPA.ProgramName
	 , DPT.CodeValue AS [ProgramTypeDescriptor]
	 , SCPA.ProgramEducationOrganizationId
	 , S.StudentUniqueId
	 , DCP.CodeValue AS [CareerPathwayDescriptor]
	 , SCPACP.CIPCode
	 , SCPACP.PrimaryCTEProgramIndicator
	 , SPA.EndDate
	 , SCPA.NonTraditionalGenderStatus
	 , SCPA.PrivateCTEProgram
	 , DTSA.CodeValue AS [TechnicalSkillsAssessmentDescriptor]
FROM edfi.StudentCTEProgramAssociation SCPA
JOIN edfi.GeneralStudentProgramAssociation SPA ON SPA.ProgramEducationOrganizationId = SCPA.ProgramEducationOrganizationId
	AND SPA.StudentUSI = SCPA.StudentUSI
	AND SPA.EducationOrganizationId = SCPA.EducationOrganizationId
	AND SPA.ProgramTypeDescriptorId = SCPA.ProgramTypeDescriptorId
	AND SPA.ProgramName = SCPA.ProgramName
	AND SPA.BeginDate = SCPA.BeginDate
JOIN edfi.Program P ON P.ProgramName = SPA.ProgramName
	AND P.ProgramTypeDescriptorId = SPA.ProgramTypeDescriptorId
	AND P.EducationOrganizationId = SPA.ProgramEducationOrganizationId
JOIN edfi.ProgramTypeDescriptor PTD ON PTD.ProgramTypeDescriptorId = P.ProgramTypeDescriptorId
JOIN edfi.Descriptor DPT ON DPT.DescriptorId = PTD.ProgramTypeDescriptorId 
JOIN edfi.Student S ON S.StudentUSI = SPA.StudentUSI
JOIN edfi.StudentCTEProgramAssociationCTEProgram SCPACP ON SCPACP.BeginDate = SCPA.BeginDate
	AND SCPACP.EducationOrganizationId = SCPA.EducationOrganizationId
	AND SCPACP.ProgramEducationOrganizationId = SCPA.ProgramEducationOrganizationId
	AND SCPACP.ProgramName = SCPA.ProgramName
	AND SCPACP.ProgramTypeDescriptorId = SCPA.ProgramTypeDescriptorId
	AND SCPACP.StudentUSI = SCPA.StudentUSI
JOIN edfi.CareerPathwayDescriptor CPD ON CPD.CareerPathwayDescriptorId = SCPACP.CareerPathwayDescriptorId
JOIN edfi.Descriptor DCP on DCP.DescriptorId = CPD.CareerPathwayDescriptorId
JOIN edfi.TechnicalSkillsAssessmentDescriptor TSAD ON TSAD.TechnicalSkillsAssessmentDescriptorId = SCPA.TechnicalSkillsAssessmentDescriptorId
JOIN edfi.Descriptor DTSA ON DTSA.DescriptorId = TSAD.TechnicalSkillsAssessmentDescriptorId
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))


---------------------------------------
---StudentHomelessProgramAssociation---
SELECT SHPA.BeginDate
	 , SHPA.EducationOrganizationId
	 , SHPA.ProgramName
	 , DPT.CodeValue AS [ProgramTypeDescriptor]
	 , SHPA.ProgramEducationOrganizationId
	 , S.StudentUniqueId
	 , DHPS.CodeValue AS [HomelessProgramServiceDescriptor]
	 , SHPAS.ServiceBeginDate
	 , SHPAS.PrimaryIndicator
	 , DHPNR.CodeValue AS [HomelessPrimaryNighttimeResidenceDescriptor]
	 , SHPA.AwaitingFosterCare
	 , SHPA.HomelessUnaccompaniedYouth
FROM edfi.StudentHomelessProgramAssociation SHPA
JOIN edfi.GeneralStudentProgramAssociation SPA ON SPA.ProgramEducationOrganizationId = SHPA.ProgramEducationOrganizationId
	AND SPA.StudentUSI = SHPA.StudentUSI
	AND SPA.EducationOrganizationId = SHPA.EducationOrganizationId
	AND SPA.ProgramTypeDescriptorId = SHPA.ProgramTypeDescriptorId
	AND SPA.ProgramName = SHPA.ProgramName
	AND SPA.BeginDate = SHPA.BeginDate
JOIN edfi.Program P ON P.ProgramName = SPA.ProgramName
	AND P.ProgramTypeDescriptorId = SPA.ProgramTypeDescriptorId
	AND P.EducationOrganizationId = SPA.ProgramEducationOrganizationId
JOIN edfi.ProgramTypeDescriptor PTD ON PTD.ProgramTypeDescriptorId = P.ProgramTypeDescriptorId
JOIN edfi.Descriptor DPT ON DPT.DescriptorId = PTD.ProgramTypeDescriptorId 
JOIN edfi.Student S ON S.StudentUSI = SPA.StudentUSI
JOIN edfi.StudentHomelessProgramAssociationHomelessProgramService SHPAS ON SHPAS.ProgramEducationOrganizationId = SHPA.ProgramEducationOrganizationId
	AND SHPAS.StudentUSI = SHPA.StudentUSI
	AND SHPAS.EducationOrganizationId = SHPA.EducationOrganizationId
	AND SHPA.ProgramTypeDescriptorId = SHPA.ProgramTypeDescriptorId
	AND SHPAS.ProgramName = SHPA.ProgramName
	AND SHPAS.BeginDate = SHPA.BeginDate
JOIN edfi.HomelessProgramServiceDescriptor HPSD ON HPSD.HomelessProgramServiceDescriptorId = SHPAS.HomelessProgramServiceDescriptorId
JOIN edfi.Descriptor DHPS ON DHPS.DescriptorId = HPSD.HomelessProgramServiceDescriptorId
JOIN edfi.HomelessPrimaryNighttimeResidenceDescriptor HPNRD ON HPNRD.HomelessPrimaryNighttimeResidenceDescriptorId = SHPA.HomelessPrimaryNighttimeResidenceDescriptorId
JOIN edfi.Descriptor DHPNR ON DHPNR.DescriptorId = HPNRD.HomelessPrimaryNighttimeResidenceDescriptorId
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))


--------------------------------------------------
---StudentLanguageInstructionProgramAssociation---
SELECT SLPA.BeginDate
	 , SLPA.EducationOrganizationId
	 , SLPA.ProgramName
	 , DPT.CodeValue AS [ProgramTypeDescriptor]
	 , SLPA.ProgramEducationOrganizationId
	 , S.StudentUniqueId
	 , DP.CodeValue AS [ParticipationDescriptor]
	 , DPr.CodeValue AS [ProficiencyDescriptor]
	 , DPg.CodeValue AS [ProgressDescriptor]
	 , DM.CodeValue AS [MonitoredDescriptor]
	 , DLIP.CodeValue as [LanguageInstructionProgramServiceDescriptor]
	 , SLPA.EnglishLearnerParticipation
FROM edfi.StudentLanguageInstructionProgramAssociation SLPA
JOIN edfi.GeneralStudentProgramAssociation SPA ON SPA.ProgramEducationOrganizationId = SLPA.ProgramEducationOrganizationId
	AND SPA.StudentUSI = SLPA.StudentUSI
	AND SPA.EducationOrganizationId = SLPA.EducationOrganizationId
	AND SPA.ProgramTypeDescriptorId = SLPA.ProgramTypeDescriptorId
	AND SPA.ProgramName = SLPA.ProgramName
	AND SPA.BeginDate = SLPA.BeginDate
JOIN edfi.Program P ON P.ProgramName = SPA.ProgramName
	AND P.ProgramTypeDescriptorId = SPA.ProgramTypeDescriptorId
	AND P.EducationOrganizationId = SPA.ProgramEducationOrganizationId
JOIN edfi.ProgramTypeDescriptor PTD ON PTD.ProgramTypeDescriptorId = P.ProgramTypeDescriptorId
JOIN edfi.Descriptor DPT ON DPT.DescriptorId = PTD.ProgramTypeDescriptorId 
JOIN edfi.Student S ON S.StudentUSI = SPA.StudentUSI
JOIN edfi.StudentLanguageInstructionProgramAssociationEnglishLanguageProficiencyAssessment SLPAELP ON SLPAELP.ProgramEducationOrganizationId = SLPA.ProgramEducationOrganizationId
	AND SLPAELP.StudentUSI = SLPA.StudentUSI
	AND SLPAELP.EducationOrganizationId = SLPA.EducationOrganizationId
	AND SLPAELP.ProgramTypeDescriptorId = SLPA.ProgramTypeDescriptorId
	AND SLPAELP.ProgramName = SLPA.ProgramName
	AND SLPAELP.BeginDate = SLPA.BeginDate
JOIN edfi.ParticipationDescriptor PD ON PD.ParticipationDescriptorId = SLPAELP.ParticipationDescriptorId
JOIN edfi.Descriptor DP ON DP.DescriptorId = PD.ParticipationDescriptorId
JOIN edfi.ProficiencyDescriptor PrD ON PrD.ProficiencyDescriptorId = SLPAELP.ProficiencyDescriptorId
JOIN edfi.Descriptor DPr ON DPr.DescriptorId = PrD.ProficiencyDescriptorId
JOIN edfi.ProgressDescriptor PgD ON PgD.ProgressDescriptorId = SLPAELP.ProgressDescriptorId
JOIN edfi.Descriptor DPg ON DPg.DescriptorId = PgD.ProgressDescriptorId
JOIN edfi.MonitoredDescriptor MD ON MD.MonitoredDescriptorId = SLPAELP.MonitoredDescriptorId
JOIN edfi.Descriptor DM ON DM.DescriptorId = MD.MonitoredDescriptorId
JOIN edfi.StudentLanguageInstructionProgramAssociationLanguageInstructionProgramService SLPAS ON SLPAS.ProgramEducationOrganizationId = SLPA.ProgramEducationOrganizationId
	AND SLPAS.StudentUSI = SLPA.StudentUSI
	AND SLPAS.EducationOrganizationId = SLPA.EducationOrganizationId
	AND SLPAS.ProgramTypeDescriptorId = SLPA.ProgramTypeDescriptorId
	AND SLPAS.ProgramName = SLPA.ProgramName
	AND SLPAS.BeginDate = SLPA.BeginDate
JOIN edfi.LanguageInstructionProgramServiceDescriptor LIPD ON LIPD.LanguageInstructionProgramServiceDescriptorId = SLPAS.LanguageInstructionProgramServiceDescriptorId
JOIN edfi.Descriptor DLIP ON DLIP.DescriptorId = LIPD.LanguageInstructionProgramServiceDescriptorId
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))


----------------------------------
---StudentMigrantProgramAssociation---
SELECT SMPA.BeginDate
	 , SMPA.EducationOrganizationId
	 , SMPA.ProgramName
	 , DPT.CodeValue AS [ProgramTypeDescriptor]
	 , SMPA.ProgramEducationOrganizationId
	 , S.StudentUniqueId
	 , SMPA.PriorityForServices
	 , SMPA.LastQualifyingMove
	 , DCSR.CodeValue AS [ContinuationOfServicesReasonDescriptor]
	 , SMPA.USInitialEntry
	 , SMPA.USMostRecentEntry
	 , SMPA.USInitialSchoolEntry
	 , SMPA.QualifyingArrivalDate
	 , SMPA.StateResidencyDate
	 , DMPS.CodeValue AS [MigrantEducationProgramServiceDescriptor]
FROM edfi.StudentMigrantEducationProgramAssociation SMPA
JOIN edfi.GeneralStudentProgramAssociation SPA ON SPA.ProgramEducationOrganizationId = SMPA.ProgramEducationOrganizationId
	AND SPA.StudentUSI = SMPA.StudentUSI
	AND SPA.EducationOrganizationId = SMPA.EducationOrganizationId
	AND SPA.ProgramTypeDescriptorId = SMPA.ProgramTypeDescriptorId
	AND SPA.ProgramName = SMPA.ProgramName
	AND SPA.BeginDate = SMPA.BeginDate
JOIN edfi.Program P ON P.ProgramName = SPA.ProgramName
	AND P.ProgramTypeDescriptorId = SPA.ProgramTypeDescriptorId
	AND P.EducationOrganizationId = SPA.ProgramEducationOrganizationId
JOIN edfi.ProgramTypeDescriptor PTD ON PTD.ProgramTypeDescriptorId = P.ProgramTypeDescriptorId
JOIN edfi.Descriptor DPT ON DPT.DescriptorId = PTD.ProgramTypeDescriptorId 
JOIN edfi.Student S ON S.StudentUSI = SPA.StudentUSI
JOIN edfi.ContinuationOfServicesReasonDescriptor CSRD ON CSRD.ContinuationOfServicesReasonDescriptorId = SMPA.ContinuationOfServicesReasonDescriptorId
JOIN edfi.Descriptor DCSR ON DCSR.DescriptorId = CSRD.ContinuationOfServicesReasonDescriptorId
JOIN edfi.StudentMigrantEducationProgramAssociationMigrantEducationProgramService SMPAS ON SMPAS.ProgramEducationOrganizationId = SMPA.ProgramEducationOrganizationId
	AND SMPAS.StudentUSI = SMPA.StudentUSI
	AND SMPAS.EducationOrganizationId = SMPA.EducationOrganizationId
	AND SMPAS.ProgramTypeDescriptorId = SMPA.ProgramTypeDescriptorId
	AND SMPAS.ProgramName = SMPA.ProgramName
	AND SMPAS.BeginDate = SMPA.BeginDate
JOIN edfi.MigrantEducationProgramServiceDescriptor MPSD ON MPSD.MigrantEducationProgramServiceDescriptorId = SMPAS.MigrantEducationProgramServiceDescriptorId
JOIN edfi.Descriptor DMPS ON DMPS.DescriptorId = MPSD.MigrantEducationProgramServiceDescriptorId
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))


----------------------------------
---StudentNeglectedOrDelinquentProgramAssociation---
SELECT SNDPA.BeginDate
	 , SNDPA.EducationOrganizationId
	 , SNDPA.ProgramName
	 , DPT.CodeValue AS [ProgramTypeDescriptor]
	 , SNDPA.ProgramEducationOrganizationId
	 , S.StudentUniqueId
	 , DNDP.CodeValue AS [NeglectedOrDelinquentProgramDescriptor]
	 , DEPL.CodeValue AS [ELAProgressLevelDescriptor]
	 , DMPL.CodeValue AS [MathematicsProgressLevelDescriptor]
	 , DNDPS.CodeValue AS [NeglectedOrDelinquentProgramServiceDescriptor]
	 , SNDPAS.ServiceBeginDate
	 , SNDPAS.PrimaryIndicator
FROM edfi.StudentNeglectedOrDelinquentProgramAssociation SNDPA
JOIN edfi.GeneralStudentProgramAssociation SPA ON SPA.ProgramEducationOrganizationId = SNDPA.ProgramEducationOrganizationId
	AND SPA.StudentUSI = SNDPA.StudentUSI
	AND SPA.EducationOrganizationId = SNDPA.EducationOrganizationId
	AND SPA.ProgramTypeDescriptorId = SNDPA.ProgramTypeDescriptorId
	AND SPA.ProgramName = SNDPA.ProgramName
	AND SPA.BeginDate = SNDPA.BeginDate
JOIN edfi.Program P ON P.ProgramName = SPA.ProgramName
	AND P.ProgramTypeDescriptorId = SPA.ProgramTypeDescriptorId
	AND P.EducationOrganizationId = SPA.ProgramEducationOrganizationId
JOIN edfi.ProgramTypeDescriptor PTD ON PTD.ProgramTypeDescriptorId = P.ProgramTypeDescriptorId
JOIN edfi.Descriptor DPT ON DPT.DescriptorId = PTD.ProgramTypeDescriptorId 
JOIN edfi.Student S ON S.StudentUSI = SPA.StudentUSI
JOIN edfi.NeglectedOrDelinquentProgramDescriptor NDPD ON NDPD.NeglectedOrDelinquentProgramDescriptorId = SNDPA.NeglectedOrDelinquentProgramDescriptorId
JOIN edfi.Descriptor DNDP ON DNDP.DescriptorId = NDPD.NeglectedOrDelinquentProgramDescriptorId
JOIN edfi.ProgressLevelDescriptor EPLD ON EPLD.ProgressLevelDescriptorId = SNDPA.ELAProgressLevelDescriptorId
JOIN edfi.Descriptor DEPL ON DEPL.DescriptorId = EPLD.ProgressLevelDescriptorId
JOIN edfi.ProgressLevelDescriptor MPLD ON EPLD.ProgressLevelDescriptorId = SNDPA.MathematicsProgressLevelDescriptorId
JOIN edfi.Descriptor DMPL ON DMPL.DescriptorId = MPLD.ProgressLevelDescriptorId
JOIN edfi.StudentNeglectedOrDelinquentProgramAssociationNeglectedOrDelinquentProgramService SNDPAS ON SNDPAS.ProgramEducationOrganizationId = SNDPA.ProgramEducationOrganizationId
	AND SNDPAS.StudentUSI = SNDPA.StudentUSI
	AND SNDPAS.EducationOrganizationId = SNDPA.EducationOrganizationId
	AND SNDPAS.ProgramTypeDescriptorId = SNDPA.ProgramTypeDescriptorId
	AND SNDPAS.ProgramName = SNDPA.ProgramName
	AND SNDPAS.BeginDate = SNDPA.BeginDate
JOIN edfi.NeglectedOrDelinquentProgramServiceDescriptor NDPSD ON NDPSD.NeglectedOrDelinquentProgramServiceDescriptorId = SNDPAS.NeglectedOrDelinquentProgramServiceDescriptorId
JOIN edfi.Descriptor DNDPS ON DNDPS.DescriptorId = NDPSD.NeglectedOrDelinquentProgramServiceDescriptorId
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))


----------------------------------
---StudentSchoolFoodServicesProgramAssociation---
SELECT SSFPA.BeginDate
	 , SSFPA.EducationOrganizationId
	 , SSFPA.ProgramName
	 , DPT.CodeValue AS [ProgramTypeDescriptor]
	 , SSFPA.ProgramEducationOrganizationId
	 , S.StudentUniqueId
	 , DSFPS.CodeValue AS [SchoolFoodServiceProgramServiceDescriptor]
FROM edfi.StudentSchoolFoodServiceProgramAssociation SSFPA
JOIN edfi.GeneralStudentProgramAssociation SPA ON SPA.ProgramEducationOrganizationId = SSFPA.ProgramEducationOrganizationId
	AND SPA.StudentUSI = SSFPA.StudentUSI
	AND SPA.EducationOrganizationId = SSFPA.EducationOrganizationId
	AND SPA.ProgramTypeDescriptorId = SSFPA.ProgramTypeDescriptorId
	AND SPA.ProgramName = SSFPA.ProgramName
	AND SPA.BeginDate = SSFPA.BeginDate
JOIN edfi.Program P ON P.ProgramName = SPA.ProgramName
	AND P.ProgramTypeDescriptorId = SPA.ProgramTypeDescriptorId
	AND P.EducationOrganizationId = SPA.ProgramEducationOrganizationId
JOIN edfi.ProgramTypeDescriptor PTD ON PTD.ProgramTypeDescriptorId = P.ProgramTypeDescriptorId
JOIN edfi.Descriptor DPT ON DPT.DescriptorId = PTD.ProgramTypeDescriptorId 
JOIN edfi.Student S ON S.StudentUSI = SPA.StudentUSI
JOIN edfi.StudentSchoolFoodServiceProgramAssociationSchoolFoodServiceProgramService SSFPAS ON SSFPAS.ProgramEducationOrganizationId = SSFPA.ProgramEducationOrganizationId
	AND SSFPAS.StudentUSI = SSFPA.StudentUSI
	AND SSFPAS.EducationOrganizationId = SSFPA.EducationOrganizationId
	AND SSFPAS.ProgramTypeDescriptorId = SSFPA.ProgramTypeDescriptorId
	AND SSFPAS.ProgramName = SSFPA.ProgramName
	AND SSFPAS.BeginDate = SSFPA.BeginDate
JOIN edfi.SchoolFoodServiceProgramServiceDescriptor SFPSD ON SFPSD.SchoolFoodServiceProgramServiceDescriptorId = SSFPAS.SchoolFoodServiceProgramServiceDescriptorId
JOIN edfi.Descriptor DSFPS ON DSFPS.DescriptorId = SFPSD.SchoolFoodServiceProgramServiceDescriptorId
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))