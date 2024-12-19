------------
---Parent---
SELECT P.ParentUniqueId
	 , P.FirstName
	 , P.LastSurname
	 , DS.CodeValue AS [SexTypeDescriptor]
	 , DAT.CodeValue AS [AddressTypeDesc]
	 , PA.City
	 , PA.PostalCode
	 , DSA.CodeValue AS [StateAbbreviationDesc]
	 , PA.StreetNumberName
	 , PA.ApartmentRoomSuiteNumber
	 , PA.NameOfCounty
	 , PA.DoNotPublishIndicator
	 , PEM.ElectronicMailAddress
	 , DEMT.CodeValue AS [ElectronicMailTypeDesc]
	 , PEM.PrimaryEmailAddressIndicator
FROM edfi.Parent P
LEFT JOIN edfi.SexDescriptor ST ON ST.SexDescriptorId = P.SexDescriptorId
LEFT JOIN edfi.Descriptor DS ON ST.SexDescriptorId = DS.DescriptorId
LEFT JOIN edfi.ParentAddress PA ON PA.ParentUSI = P.ParentUSI
LEFT JOIN edfi.AddressTypeDescriptor AT ON AT.AddressTypeDescriptorId = PA.AddressTypeDescriptorId
LEFT JOIN edfi.Descriptor DAT ON AT.AddressTypeDescriptorId = DAT.DescriptorId
LEFT JOIN edfi.StateAbbreviationDescriptor SAT ON SAT.StateAbbreviationDescriptorId = PA.AddressTypeDescriptorId
LEFT JOIN edfi.Descriptor DSA ON DSA.DescriptorId = SAT.StateAbbreviationDescriptorId
LEFT JOIN edfi.ParentElectronicMail PEM ON PEM.ParentUSI = P.ParentUSI
LEFT JOIN edfi.ElectronicMailTypeDescriptor EMT ON EMT.ElectronicMailTypeDescriptorId = PEM.ElectronicMailTypeDescriptorId
LEFT JOIN edfi.Descriptor DEMT ON DEMT.DescriptorId = EMT.ElectronicMailTypeDescriptorId 
WHERE ((P.FirstName = 'Michael' AND P.LastSurname = 'Jones') OR (P.FirstName = 'Alexis' AND P.LastSurname = 'Johnson'))

------------------------------
---StudentParentAssociation---
SELECT P.ParentUniqueId
	 , S.StudentUniqueId
	 , SPA.EmergencyContactStatus
	 , SPA.PrimaryContactStatus
	 , DR.CodeValue AS [RelationType]
FROM edfi.StudentParentAssociation SPA
JOIN edfi.Student S ON S.StudentUSI = SPA.StudentUSI
JOIN edfi.Parent P ON P.ParentUSI = SPA.ParentUSI
LEFT JOIN edfi.RelationDescriptor RT ON RT.RelationDescriptorId = SPA.RelationDescriptorId
LEFT JOIN edfi.Descriptor DR on DR.DescriptorId = RT.RelationDescriptorId
WHERE ((P.FirstName = 'Michael' AND P.LastSurname = 'Jones') OR (P.FirstName = 'Alexis' AND P.LastSurname = 'Johnson'))