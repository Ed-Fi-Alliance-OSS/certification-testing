------------
---Parent---
select p.parentuniqueid
	 , p.firstname
	 , p.lastsurname
	 , ds.codevalue as sextypedescriptor
	 , dat.codevalue as addresstypedesc
	 , pa.city
	 , pa.postalcode
	 , dsa.codevalue as stateabbreviationdesc
	 , pa.streetnumbername
	 , pa.apartmentroomsuitenumber
	 , pa.nameofcounty
	 , pa.donotpublishindicator
	 , pem.electronicmailaddress
	 , demt.codevalue as electronicmailtypedesc
	 , pem.primaryemailaddressindicator
from edfi.parent p
left join edfi.sexdescriptor st on st.sexdescriptorid = p.sexdescriptorid
left join edfi.descriptor ds on st.sexdescriptorid = ds.descriptorid
left join edfi.parentaddress pa on pa.parentusi = p.parentusi
left join edfi.addresstypedescriptor at on at.addresstypedescriptorid = pa.addresstypedescriptorid
left join edfi.descriptor dat on at.addresstypedescriptorid = dat.descriptorid
left join edfi.stateabbreviationdescriptor sat on sat.stateabbreviationdescriptorid = pa.addresstypedescriptorid
left join edfi.descriptor dsa on dsa.descriptorid = sat.stateabbreviationdescriptorid
left join edfi.parentelectronicmail pem on pem.parentusi = p.parentusi
left join edfi.electronicmailtypedescriptor emt on emt.electronicmailtypedescriptorid = pem.electronicmailtypedescriptorid
left join edfi.descriptor demt on demt.descriptorid = emt.electronicmailtypedescriptorid 
where ((p.firstname = 'michael' and p.lastsurname = 'jones') or (p.firstname = 'alexis' and p.lastsurname = 'johnson'));

------------------------------
---StudentParentAssociation---
select p.parentuniqueid
	 , s.studentuniqueid
	 , spa.emergencycontactstatus
	 , spa.primarycontactstatus
	 , dr.codevalue as relationtype
from edfi.studentparentassociation spa
join edfi.student s on s.studentusi = spa.studentusi
join edfi.parent p on p.parentusi = spa.parentusi
left join edfi.relationdescriptor rt on rt.relationdescriptorid = spa.relationdescriptorid
left join edfi.descriptor dr on dr.descriptorid = rt.relationdescriptorid
where ((p.firstname = 'michael' and p.lastsurname = 'jones') or (p.firstname = 'alexis' and p.lastsurname = 'johnson'));