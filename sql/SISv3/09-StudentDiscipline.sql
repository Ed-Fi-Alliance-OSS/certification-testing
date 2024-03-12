------------------------
---DisciplineIncident---
SELECT DI.IncidentDate
	 , DI.IncidentIdentifier
	 , DI.SchoolId
	 , DB.CodeValue AS [BehaviorDescriptor]
	 , DIL.CodeValue AS [IncidentLocationDescriptor]
	 , DRD.CodeValue AS [ReporterDescriptionDescriptor]
	 , DI.ReporterName
	 , S.StaffUniqueId
FROM edfi.DisciplineIncident DI
LEFT JOIN edfi.DisciplineIncidentBehavior DIB ON DIB.IncidentIdentifier = DI.IncidentIdentifier
    AND DIB.SchoolId = DI.SchoolId
LEFT JOIN edfi.BehaviorDescriptor BD ON BD.BehaviorDescriptorId = DIB.BehaviorDescriptorId
LEFT JOIN edfi.Descriptor DB ON DB.DescriptorId = BD.BehaviorDescriptorId
LEFT JOIN edfi.IncidentLocationDescriptor ILD ON ILD.IncidentLocationDescriptorId = DI.IncidentLocationDescriptorId
LEFT JOIN edfi.Descriptor DIL ON DIL.DescriptorId = ILD.IncidentLocationDescriptorId
LEFT JOIN edfi.ReporterDescriptionDescriptor RDD ON RDD.ReporterDescriptionDescriptorId = DI.ReporterDescriptionDescriptorId
LEFT JOIN edfi.Descriptor DRD ON DRD.DescriptorId = RDD.ReporterDescriptionDescriptorId
LEFT JOIN edfi.Staff S ON S.StaffUsi = DI.StaffUSI
WHERE DI.SchoolId IN (255901107,255901001)

------------------------------------------
---StudentDisciplineIncidentAssociation---
SELECT SDIA.IncidentIdentifier
	 , SDIA.SchoolId
	 , DSPC.CodeValue AS [StudentParticipationCodeDescriptor]
	 , S.StudentUniqueId
FROM edfi.StudentDisciplineIncidentAssociation SDIA
JOIN edfi.StudentParticipationCodeDescriptor SPCD ON SPCD.StudentParticipationCodeDescriptorId = SDIA.StudentParticipationCodeDescriptorId
JOIN edfi.Descriptor DSPC ON DSPC.DescriptorId = SPCD.StudentParticipationCodeDescriptorId
JOIN edfi.Student S ON S.StudentUSI = SDIA.StudentUSI
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))

----------------------
---DisciplineAction---
SELECT DA.DisciplineActionIdentifier
	 , D.CodeValue AS [DisciplineDescriptor]
	 , DA.DisciplineDate
	 , S.StudentUniqueId
	 , DA.ActualDisciplineActionLength
	 , DA.ReceivedEducationServicesDuringExpulsion
	 , DADI.IncidentIdentifier
	 , DADI.SchoolId
	 , SDI.StudentUniqueId AS [DisciplineIncidentStudentUniqueId]
	 , DA.ResponsibilitySchoolId
	 , DA.IEPPlacementMeetingIndicator
FROM edfi.DisciplineAction DA
JOIN edfi.DisciplineActionDiscipline DAD ON DAD.DisciplineActionIdentifier = DA.DisciplineActionIdentifier
	AND DAD.StudentUSI = DA.StudentUSI
    AND DAD.DisciplineDate = DA.DisciplineDate
JOIN edfi.DisciplineDescriptor DD ON DD.DisciplineDescriptorId = DAD.DisciplineDescriptorId
JOIN edfi.Descriptor D ON D.DescriptorId = DD.DisciplineDescriptorId
JOIN edfi.Student S ON S.StudentUSI = DA.StudentUSI
JOIN edfi.DisciplineActionStudentDisciplineIncidentAssociation DADI ON DADI.StudentUSI = DA.StudentUSI
    AND DADI.DisciplineActionIdentifier = DA.DisciplineActionIdentifier
    AND DADI.DisciplineDate = DA.DisciplineDate
JOIN edfi.StudentDisciplineIncidentAssociation SDIA on SDIA.StudentUSI = DA.StudentUSI
	AND SDIA.IncidentIdentifier = DADI.IncidentIdentifier
JOIN edfi.Student SDI ON SDI.StudentUSI = DADI.StudentUSI
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))