-------------
---Student---
SELECT S.StudentUniqueId
     , S.BirthCity
	 , DC.CodeValue AS [BirthCountryDescriptor]
	 , S.BirthDate
	 , S.FirstName
	 , S.MiddleName
	 , S.LastSurname
	 , S.GenerationCodeSuffix
FROM edfi.Student S
LEFT JOIN edfi.CountryDescriptor CD ON CD.CountryDescriptorId = S.BirthCountryDescriptorId
LEFT JOIN edfi.Descriptor DC ON DC.DescriptorId = CD.CountryDescriptorId
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))

