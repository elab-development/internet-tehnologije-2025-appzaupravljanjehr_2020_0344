from django.urls import path
from django.shortcuts import redirect
from users.views import (
    login_view,
    logout_view,
    profile_view,
    update_profile,
    profile_create,
    profile_save,
    users_list,
    delete_user,
    profile_detail,
    update_user
)

urlpatterns = [
    path('', lambda request: redirect('login'), name='home'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('profile/', profile_view, name='profile'),
    path('profile/azuriraj/', update_profile, name='update_profile'),
    path('profile/kreiraj/', profile_create, name='profile_create'),
    path('profile/sacuvaj/', profile_save, name='profile_save'),
    path('profile/list/', users_list, name='users_list'),
    path('profile/<int:user_id>/', profile_detail, name='profile_detail'),
    path('profile/edit/', profile_create, name='profile_edit'),
    path('user/update/<int:user_id>/', update_user, name='update_user'),
    path('user/delete/<int:user_id>/', delete_user, name='delete_user'),
]
