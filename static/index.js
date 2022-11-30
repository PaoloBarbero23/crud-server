"use strict";

$(document).ready(function () {
    let divIntestazione = $("#divIntestazione");
    let divFilters = $(".card").eq(0);
    let divCollections = $("#divCollections");
    let table = $("#mainTable");
    let divDettagli = $("#divDettagli");
    let btnAdd = $("#btnAdd")
    let currentCollection = "";

    divFilters.hide();
    $("#lstHair").prop("selectedIndex", -1);

    let textarea;
    
    let request = inviaRichiesta("GET", "/api/getCollections");
    request.fail(errore);
    request.done((collections) => {
        console.log(collections);

        for (const collection of collections) {
            let label = divCollections.children("label").eq(0).clone();
            label.children("span").text(collection.name);
            label.children("input").val(collection.name).on("click", richiediDettagli);
            label.appendTo(divCollections);
            divCollections.append("<br>");
        }
        divCollections.children("label").eq(0).remove();
    });

    $("#btnFind").on("click", function () {
        // prendo i parametri
        let hair = $("#lstHair").val().toLowerCase();
        let param = {
          hair,
        };
        if (!$("#Male").prop("checked") && !$("#Female").prop("checked")) {
          alert("Seleziona almeno un genere");
        } else if (
          ($("#Male").prop("checked") && !$("#Female").prop("checked")) ||
          (!$("#Male").prop("checked") && $("#Female").prop("checked"))
        ) {
          let gender = divFilters.find("input[type=checkbox]:checked").val();
          param["gender"] = gender;
        }
        let request = inviaRichiesta("GET", "/api/" + currentCollection, param);
        request.fail(errore);
        request.done((data) => {
          console.log(data);
          let tbody = table.children("tbody");
            tbody.empty()
            for (const item of data) {
                let tr = $("<tr>").appendTo(tbody);
                $("<td>").appendTo(tr).text(item._id).prop("_id", item._id).prop("method", "GET").on("click", dettagli);
                $("<td>").appendTo(tr).text(item.val).prop("_id", item._id).prop("method", "GET").on("click", dettagli)
                let td = $("<td>").appendTo(tr).prop("id_record", item._id);
                $("<div>").appendTo(td).prop("method", "PATCH").on("click", dettagli)
                $("<div>").appendTo(td).prop("method", "PUT").on("click", dettagli)
                $("<div>").appendTo(td).on("click", eliminaRecord);

            }
        });
      });
    function richiediDettagli() {
        let collection = divCollections.find("input:checked").eq(0).val()
        let requestCollection = inviaRichiesta("GET", `/api/${collection}`);
        requestCollection.fail(errore);
        requestCollection.done((data) => {
            console.log(data)
            currentCollection = collection;
            divIntestazione.find("strong").eq(0).text(currentCollection);
            divIntestazione.find("strong").eq(1).text(data.length);

            let tbody = table.children("tbody");
            tbody.empty()
            for (const item of data) {
                let tr = $("<tr>").appendTo(tbody);
                $("<td>").appendTo(tr).text(item._id).prop("_id", item._id).prop("method", "GET").on("click", dettagli);
                $("<td>").appendTo(tr).text(item.val).prop("_id", item._id).prop("method", "GET").on("click", dettagli)
                let td = $("<td>").appendTo(tr).prop("id_record", item._id);
                $("<div>").appendTo(td).prop("method", "PATCH").on("click", dettagli)
                $("<div>").appendTo(td).prop("method", "PUT").on("click", dettagli)
                $("<div>").appendTo(td).on("click", eliminaRecord);

            }

            if (collection == "Unicorns")
                divFilters.show();
            else
                divFilters.hide()
        })
    }

    function eliminaRecord() {
        let record_id = $(this).parent().prop("id_record");
        if (confirm("Sicuro di eliminare il record?")) {
            let requestDelete = inviaRichiesta("DELETE", `/api/${currentCollection}/${record_id}`)
            requestDelete.fail(errore);
            requestDelete.done((data) => {
                alert("Record cancellato correttamente")
                richiediDettagli();
            })

        }
    }

    function dettagli() {
        let metodo = $(this).prop("method")
        let id;
        if (metodo == "GET")
            id = $(this).prop("_id");
        else
            id = $(this).parent().prop("id_record");
        console.log(currentCollection)
        let requestDettagli = inviaRichiesta("GET", "/api/" + currentCollection + "/" + id);
        requestDettagli.fail(errore);
        requestDettagli.done((data) => {
            console.log(data)
            if (metodo == "GET") {

                let str = ""
                for (const key in data) {
                    str += `<b>${key}:</b> ${JSON.stringify(data[key])}<br/>`
                }

                divDettagli.html(str);
            }
            else {
                let stream
                divDettagli.empty();
                delete data._id
                textarea = $("<textarea>").appendTo(divDettagli).val(JSON.stringify(data, null, 2));
                textarea.css("height", textarea.get(0).scrollHeight + "px")

                addButton(metodo, id)
            }
        })
    }

    btnAdd.on("click", () => {
        
        divDettagli.empty();
        let textarea = $("<textarea>").appendTo(divDettagli).val("{}");

        addButton("POST");
    })

    function addButton(metodo, id="") {
        $("<button>").appendTo(divDettagli).addClass("btn btn-success").text("Invia").on("click", ()=>{
            let stream
            try {
                console.log(textarea.val())
                stream = JSON.parse(textarea.val())
            }
            catch (error) {
                alert("Formato JSON non valido")
                return;
            }
            let requestAdd = inviaRichiesta(metodo, "/api/" + currentCollection+"/"+id, { stream });
            requestAdd.fail(errore);
            request.done((data) => {
                console.log(data);
                alert("Operazione eseguita con successo")
                richiediDettagli()
            })
        });
    }

});
