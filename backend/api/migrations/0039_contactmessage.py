from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0038_merge_0037_migrations'),
    ]

    operations = [
        migrations.CreateModel(
            name='ContactMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, verbose_name='Nom')),
                ('email', models.EmailField(max_length=254, verbose_name='Email')),
                ('subject', models.CharField(max_length=300, verbose_name='Sujet')),
                ('message', models.TextField(verbose_name='Message')),
                ('status', models.CharField(
                    choices=[('NEW', 'Nouveau'), ('READ', 'Lu'), ('REPLIED', 'Répondu')],
                    default='NEW',
                    max_length=20,
                    verbose_name='Statut'
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Message de contact',
                'verbose_name_plural': 'Messages de contact',
                'ordering': ['-created_at'],
            },
        ),
    ]
