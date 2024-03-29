let database = firebase.database();
let USER_ID = window.location.search.match(/\?id=(.*)/)[1];

$(document).ready(function () {
    filterSelect();
    $('.nav-link-signOut').click(signOut)
    $(".add-posts").click(addPostClick)
    $(".filter-privacy").change(filterSelect);
    observer();
});

function observer() {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            if (user != null) {
                let email = user.email;
                let profilePicUrl = getUserPhotoURL();
                $(".nameUser").html(email);
                $(".img-user").css('background-image', 'url(img/ni.jpg)');
                $(".photoUser").css('background-image', 'url(' + profilePicUrl + ')');
            }
        }
    })
}


function addPostClick(event) {
    event.preventDefault();
    let like = 0;
    let newtext = $(".posts-input").val();
    let postType = $(".privacyPost").val();
    getdataPost(newtext, postType, like);
    $(".posts-input").val("");
}

function getdataPost(newtext, postType, like) {
    let postsFromDB = addPostToDB(newtext, postType, like);
    createPost(newtext, postsFromDB.key, postType, like);
}

function addPostToDB(newtext, postType, like) {
    return database.ref("posts/" + USER_ID).push({
        text: newtext,
        postType: postType,
        like: like
    });
}

function createPost(text, key, type, like) {
    template = `
        <div class="list-post" data-div-id=${key}>
            <div class="card mb-2"  data-div-id=${key}>
                <div class=" d-flex  justify-content-between background-green">
                    <div>
                        <button class="btn" value="Delete" data-delete-id=${key}><i class="fas fa-trash-alt"></i> </button>
                        <button class="btn" value="Edit" data-edit-id=${key}><i class="fas fa-edit"></i></button> 
                        <button class="btn" value="salvar" style="display: none;" data-salve-id=${key}><i class="fas fa-save"></i> </button>
                    </div>
                    <div>
                    <form id="like-form">
                        <span data-text-id=${key}>${type}<span>
                        <button class="btn" data-like-id=${key} data-count-id=${like} class="like-button"><i class="fab fa-gratipay"></i>${like}</button>   
                    </form>    
                    </div>                
                </div>    
                <div class="card-body">
                    <p class="card-text posts-input" data-text-id=${key}>${text}</p>
                </div>            
            </div>            
        </div>
        `
    $(".list-posts").prepend(template)

    deletePost(key);
    editPost(key);
    likePost(key);
}

function deletePost(key) {
    $(`button[data-delete-id="${key}"]`).click(function () {
        let action = confirm("Tem certeza que deseja excluir esse post?")
        if (action) {
            database.ref("posts/" + USER_ID + "/" + key).remove();
            $(`.list-post[data-div-id=${key}]`).remove();
        }

    });
}

function editPost(key) {
    $(`button[data-edit-id="${key}"]`).click(function () {
        $(`button[data-edit-id="${key}"]`).hide();
        $(`button[data-delete-id="${key}"]`).hide();
        $(`button[data-salve-id="${key}"]`).show();
        $(`p[data-text-id="${key}"]`).attr('contenteditable', 'true').focus();

        $(`button[data-salve-id="${key}"]`).click(function () {

            $(`button[data-salve-id="${key}"]`).hide();
            $(`button[data-edit-id="${key}"]`).show();
            $(`button[data-delete-id="${key}"]`).show();

            let editedText = $(`p[data-text-id="${key}"]`).html();

            database.ref("posts/" + USER_ID + "/" + key).update({
                text: editedText
            });

            $(`p[data-text-id="${key}"]`).html(editedText);
            $(`p[data-text-id="${key}"]`).attr('contenteditable', 'false');

        })
    });
}

function likePost(key) {
    $(`button[data-like-id="${key}"]`).click(function () {
        event.preventDefault();
        let count = $(this).data("count-id")
        count += 1
        $(this).data("count-id", count)
        $(this).html(`<i class="fab fa-gratipay"></i>` + count)

        database.ref("posts/" + USER_ID + "/" + key).update({
            like: count
        });
    });
}

function filterSelect() {
    let selectPrivacy = $(".filter-privacy").val();
    if (selectPrivacy == "Todos") {
        getPostsFromDB();
    } else {
        getFilteredPostFromDb(selectPrivacy);
    }
}

function getPostsFromDB() {
    $(".list-posts").html("");
    database.ref("posts/" + USER_ID).once('value')

        .then(function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                let childKey = childSnapshot.key;
                let childData = childSnapshot.val();
                createPost(childData.text, childKey, childData.postType, childData.like)
            });
        });
}

function getFilteredPostFromDb(selectPrivacy) {
    $(".list-posts").html("");
    database.ref("posts/" + USER_ID).orderByChild("postType").equalTo(selectPrivacy)
        .once('value').then(function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                let childKey = childSnapshot.key;
                let childData = childSnapshot.val();
                createPost(childData.text, childKey, childData.postType, childData.like);
            });
        });
}

function signOut() {
    firebase.auth().signOut()
        .then(function () {
            window.location = "index.html"
        })
        .catch(function (error) {
            console.log(error);
        })
}

function getUserPhotoURL() {
    return firebase.auth().currentUser.photoURL || 'img/ni.jpg';
}