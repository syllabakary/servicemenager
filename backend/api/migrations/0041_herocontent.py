from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0040_service_icon_show_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='HeroContent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(default='Nous aimons vous rendre la vie plus facile !', max_length=200)),
                ('subtitle', models.TextField(default="Ménage, aide à domicile, jardinage, garde d'enfant : depuis + de 20 ans, nous nous tenons à vos côtés pour rendre votre quotidien plus serein.")),
                ('description', models.TextField(blank=True, default='Retrouvez du temps pour vous grâce aux services à la personne.')),
                ('background_image', models.ImageField(blank=True, null=True, upload_to='hero/')),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Contenu Hero',
            },
        ),
    ]
