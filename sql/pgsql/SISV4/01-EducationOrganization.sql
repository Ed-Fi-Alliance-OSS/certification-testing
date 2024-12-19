------------
---School---
select eo.educationorganizationid
	 , dat.codevalue as addresstypedescriptor
	 , eoa.city
	 , eoa.postalcode
	 , dsa.codevalue as stateabbreviationdescriptor
	 , eoa.streetnumbername
	 , deoc.codevalue as educationorganizationcategorydescriptor
	 , deois.codevalue as educationorganizationidentificationsystemdescriptor
	 , eoic.identificationcode as educationorganizationidentificationcode
	 , dgl.codevalue as schoolgradelevel
	 , ditnt.codevalue as institutiontelephonenumbertypedescriptor
	 , eoit.telephonenumber
	 , s.localeducationagencyid
	 , eo.nameofinstitution
	 , dsc.codevalue as schoolcategorydescriptor
	 , s.schoolid
	 , eo.shortnameofinstitution
from edfi.educationorganization eo
join edfi.school s on s.schoolid = eo.educationorganizationid
join edfi.educationorganizationaddress eoa on eoa.educationorganizationid = eo.educationorganizationid
join edfi.descriptor dat on eoa.addresstypedescriptorid = dat.descriptorid
join edfi.descriptor dsa on eoa.stateabbreviationdescriptorid = dsa.descriptorid 
join edfi.educationorganizationcategory eoc on eoc.educationorganizationid = eo.educationorganizationid
join edfi.descriptor deoc on eoc.educationorganizationcategorydescriptorid = deoc.descriptorid
left join edfi.educationorganizationidentificationcode eoic on eo.educationorganizationid = eoic.educationorganizationid
left join edfi.educationorganizationidentificationsystemdescriptor eoisd
	on eoic.educationorganizationidentificationsystemdescriptorid = eoisd.educationorganizationidentificationsystemdescriptorid
left join edfi.descriptor deois on deois.descriptorid = eoisd.educationorganizationidentificationsystemdescriptorid
join edfi.schoolgradelevel sgl on sgl.schoolid = s.schoolid
join edfi.gradeleveldescriptor gld on gld.gradeleveldescriptorid = sgl.gradeleveldescriptorid
join edfi.descriptor dgl on dgl.descriptorid = gld.gradeleveldescriptorid
left join edfi.educationorganizationinstitutiontelephone eoit on eoit.educationorganizationid = eo.educationorganizationid
left join edfi.descriptor ditnt on ditnt.descriptorid = eoit.institutiontelephonenumbertypedescriptorid
left join edfi.schoolcategory sc on sc.schoolid = s.schoolid
left join edfi.descriptor dsc on dsc.descriptorid = sc.schoolcategorydescriptorid
where eo.educationorganizationid in (255901333, 255901444);

------------
---Course---
select das.codevalue as academicsubjectdescriptor
     , c.coursecode
	 , dcis.codevalue as courseidentificationsystemdescriptor
     , cic.identificationcode
	 , dclc.codevalue as courselevelcharacteristictypedescriptor
     , c.coursetitle
     , c.educationorganizationid
     , c.numberofparts
	 , c.maxcompletionsforcredit
from edfi.course c
left join edfi.academicsubjectdescriptor asd on asd.academicsubjectdescriptorid = c.academicsubjectdescriptorid
left join edfi.descriptor das on das.descriptorid = asd.academicsubjectdescriptorid
join edfi.courseidentificationcode cic on cic.coursecode = c.coursecode
	and cic.educationorganizationid = c.educationorganizationid
join edfi.courseidentificationsystemdescriptor cisd on cic.courseidentificationsystemdescriptorid = cisd.courseidentificationsystemdescriptorid
join edfi.descriptor dcis on dcis.descriptorid = cisd.courseidentificationsystemdescriptorid
left join edfi.courselevelcharacteristic clc on c.coursecode = clc.coursecode
	and clc.educationorganizationid = c.educationorganizationid
left join edfi.descriptor dclc on clc.courselevelcharacteristicdescriptorid = dclc.descriptorid
where c.coursecode in ('03100500', 'art 01');

-------------
---Program---
select p.educationorganizationid
	 , p.programid
	 , p.programname
	 , dpt.codevalue as programtypedescriptor
from edfi.program p
join edfi.programtypedescriptor ptd on p.programtypedescriptorid = ptd.programtypedescriptorid
join edfi.descriptor dpt on ptd.programtypedescriptorid = dpt.descriptorid
where dpt.codevalue = 'bilingual';

-----------------
---ClassPeriod---
select cp.classperiodname
     , cp.schoolid
	 , cpmt.starttime
	 , cpmt.endtime
from edfi.classperiod cp
left join edfi.classperiodmeetingtime cpmt
	on cpmt.classperiodname = cp.classperiodname and cpmt.schoolid = cp.schoolid
where cp.schoolid in (255901001,255901107)
	and cp.classperiodname in ('class period 1','class period 01');

--------------
---Location---
select l.classroomidentificationcode
	 , l.schoolid
	 , l.maximumnumberofseats
from edfi.location l
where l.schoolid in (255901107,255901001) 
	and l.classroomidentificationcode in ('501','901');