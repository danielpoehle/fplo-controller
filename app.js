(function () {
    'use strict'; 

    angular.module('FploControl', [])
    .controller('FploController', FploController)
    .service('FploService', FploService);
    
    FploController.$inject = ['FploService'];
    function FploController(FploService) {
        let fploList = this;

        fploList.Filename = 'bla';        
        fploList.loadComplete = false;
        fploList.startDate = luxon.DateTime.now();   
        fploList.selectedYear = fploList.startDate.year;
        fploList.currentWeek = fploList.startDate.weekNumber;
        fploList.ABFKInstance = [];
        fploList.KanBan = [];
        fploList.Work = [];

       
        fploList.showWork = function(){
            fploList.Work = [];
            if(fploList.KanBan.length > 0 && fploList.ABFKInstance.length > 0){                
                for (let kw = fploList.currentWeek-4; kw < fploList.currentWeek+8; kw+=1) { 
                    if(kw < 1 || kw > 52){continue;}
                    let abfk = fploList.ABFKInstance.filter((a) => a.BOB_DATE.Year === fploList.selectedYear && 
                                                                   a.BOB_DATE.KW === kw &&
                                                                   a.Vorgang >= 50000 && a.Vorgang < 60000);
                    console.log(abfk);
                    fploList.Work.push({
                        'KW': kw
                    });
                }
                fploList.loadComplete = true;
            }else{
                console.log("At least one selected list is empty.");
            }
        };
        

        $(document).ready(function () {
            $('#list').bind('change', handleABFK);
            $('#tbl').bind('change', handleKanBan);
        });

        async function handleABFK(e) {
            const file = e.target.files[0];
            const data = await file.arrayBuffer();
            /* data is an ArrayBuffer */
            const workbook = XLSX.read(data);

            let df = XLSX.utils.sheet_to_json(workbook.Sheets['Sheet']);
            for (let i = 0; i < df.length; i+= 1) {
                const element = df[i];
                const origTxt = element['Bob Soll'];
                let tm = luxon.DateTime.fromFormat(origTxt, 'EEEE, d. MMMM yyyy', { locale: 'de-DE' });
                df[i]['BOB_DATE'] = {'DText': tm.toLocaleString(), 'DNumber': tm.ts, 'Original': origTxt, 'KW': tm.weekNumber, 'Year': tm.year};
            }
          
            /* DO SOMETHING WITH workbook HERE */            
            fploList.ABFKInstance = df;
          };

          async function handleKanBan(e) {
            const file = e.target.files[0];
            const data = await file.arrayBuffer();
            /* data is an ArrayBuffer */
            const workbook = XLSX.read(data);

            let range = XLSX.utils.decode_range(workbook.Sheets['MA_Arbeitssteuerung']['!ref']);
            range.s.r = 1; // <-- zero-indexed, so setting to 1 will skip row 0
            workbook.Sheets['MA_Arbeitssteuerung']['!ref'] = XLSX.utils.encode_range(range);

            let df = XLSX.utils.sheet_to_json(workbook.Sheets['MA_Arbeitssteuerung']);
            
          
            /* DO SOMETHING WITH workbook HERE */            
            //console.log(df);
            fploList.KanBan = df;
          };
             
    };

    function FploService(){
        let service = this;
    };

})();